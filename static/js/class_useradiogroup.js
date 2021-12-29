'use strict';
/*----------------------------------------------------------------------------------------------------------------------
             Клас описує групу радіокнопок, які мають один ключ modbus джерела та головний чекбокс.
 ----------------------------------------------------------------------------------------------------------------------
 key         - Ключ Modbus багатобітового значення, що надсилається у запиті до пристрою та значення одного біту з
               якого необхідно вивести на сторінку.
 obj_id      - Назва для об'єкту в словнику htmlObjects, не існуючий на сторінці html
 sources     - словник із такої кількості елементів, скільки на сторінці є радіокнопок (елементів input типу radio),
               в якому в якості ключів використані id радіокнопок, а в якості значеннь список, що включає параметр name
               підлеглої групи радіокнопок та id головного чекбокса (елементів input типу checkbox). В цьому проекті
               підегла група одиного чекбоксу -  дві радіокнопки. Кількість підлеглих груп (чекбоксів) не обмежена
 bitformat   - Назва бітового формату, на підставі якого зчитане значення буде інтерпретуватися в групу радіокнопок.
               Для розширеної версії формату NUMXDI - параметр може бути порожній
               Робилося під бітовий формат BIT24А. Розширялося під не бітовий формат NUMXDI
 settingsNum - Номер цільового фізичного компоненту пристрою (DI або VD)
----------------------------------------------------------------------------------------------------------------------*/
class UseRadioGroup {
    constructor (key, obj_name, sources, bitformat, settingsNum=null) {
        this.key = key;
        this.objectid = obj_name;                                                                   // Умовна назва об'єкта
        this.obj = {};                                                                              // Словник із радіокнопок
        this.last = {};                                                                             // Словник із останніх значень, в якості ключа - id кожної радіокнопки
        this.orig = null;                                                                           // Одне значення на групу
        this.obj_main_checkbox = {};                                                                // Словник чекбоксів в якості ключа - id кожної радіокнопки
        for (let id in sources) {                                                                   // По всім радіокнопкам всіх підгруп
            this.obj[id] = getElementEx('Конструктор MultiRadioGroup', id);                             // Радіокнопока
            this.obj_main_checkbox[id] = getElementEx('Конструктор UseRadioGroup', sources[id][1]);     // Головний чекбокс цієї радіокнопки
            this.last[id] = null;                                                                       // Останнє значення цієї радіокнопки
        }
        this.format = bitformat;
        this.setingsNum = settingsNum;
        this.type = (bitformat.substr(0,3) === 'BIT') ? 0 : 1;      // 0 - Одно джерело для всіх радіо в групі і зберігається як одна бітова строка (для VD - DIsources)
                                                                                 // 1 - Одно джерело для всіх радіо в групі і зберігається як ComboDI (для налаштування DI)
        requestOriginValue(this);
    }


    // Поверне значення підгрупи радіокнопок або Збирає дані з радіо та чекбоксів всієї групи та вертає єдине бітове значенням
    getValue(radio_id, mode = 'value_by_name') {
        let name, value;
        if (radio_id !== '') name = this.obj[radio_id].name;                                // Якщо вказана радіокнопка - отримуємо параметр name підгрупи радіокнопок, до якої вона належить
        switch (mode) {
            case 'value_by_name':
                // Режим 0: Вертає значення value для підгрупи з одним іменем
                for (let id in this.obj) {                                                  // Серед всіх радіокнопок
                    if ((this.obj[id].name === name) && (this.obj[id].checked))                 // Якщо радіокнопка належить до цільової підгрупи та обрана (обрана може бути тільки одна)
                        return this.obj[id].value;                                                  // Вертаємо її параметр value
                }
                return null;
            case 'result_value':
                // Режим 1: Вертає загальне значення всієї групи (для 0), готове для запису/ініціалізації
                switch (this.type) {
                    case 0:                                                                 // Для бітового джерела
                        value = '0000000000000000'.split('');                                   // Готуємо шаблон результату
                        for (let id in this.obj) {                                              // Перебираю всі ключі (id радіокнопок)
                            let xbit = getBitByFormat(this.obj[id].value, this.format);             // Отримую номер біту по параметру value цієї радіокнопки
                            if (xbit !== null) value[xbit] = this.obj[id].checked ? '1' : '0';      // Заповнюємо значення біту значенням чекбоксу
                        }
                        return value.reverse().join('');                                        // Розвертаємо заповнений шаблон та вертаємо як строку
                    case 1:                                                                 // Для джерела - номера входу
                        for(value in this.obj) break;                                           // Отримую id першої радіокнопки так як в об'єкті підгрупа одна
                        value = this.getValue(value,'value_by_name');                    // Отримую значення єдиної підгрупи
                        return (value === null) ? ('p0') : (value +this.setingsNum);
                }

            case 'idlist_by_name':
                // Вертає масив id радіокнопок з заданим іменем
                let idlist = [];
                for (let id in this.obj) {
                    if (this.obj[id].name === name) idlist.push(id);
                }
                return idlist;
            default:
                const arr = ['value_by_name','result_value','idlist_by_name'];
                alert('Вітаю!!\nДооптимізувався.\nШукай, де ззовні викликається метод getValue з параметром [' + mode +
                '] та міняй його на [' + arr[mode] +']');
                return '';
        }

    }


    // Встановлює значення для елемента радіокнопки.
    setValue(radio_id, mode, value) {
        const name = this.obj[radio_id].name;                                               // Отримуємо ім'я підгрупи радіокнопок
        switch (mode) {
            case 'set_by_id':
                // Встановити/Скинути по id
                this.obj[radio_id].checked = value;                                                 // value тут true/false
                break;
            case 'reset_by_name':                                                               // Скинути всю підгрупу цільової радіокнопки
                for (let id in this.obj) {                                                          // Серед всіх радіокнопок
                    if (this.obj[id].name === name) this.obj[id].checked = false;                       // Якщо кнопка відноситься до цільової підгрупи прибираємо з неї піптик
                }
                break;
            case 'restore_last':
                // Відновити попереднє значення підгрупи цільової радіокнопки
                let  xbit;
                if (this.last[radio_id] === null) {                                                 // Якщо підгрупа ще не змінювалося
                    if (this.orig !== null) {                                                           // Якщо значення ініціалізоване
                        const di = this.orig.split('');                                                     // Отримуємо масив з напрямку та номеру
                        for (let id in this.obj) {                                                          // По всіх радіокнопках
                            if (this.obj[id].name === this.obj[radio_id].name) {                                // Якщо кнопка входить в цільову підгрупу
                                //--------------------
                                let buse;
                                switch (this.type) {
                                    case 0:                                                                     // Для побітового режиму
                                        xbit = getBitByFormat(this.obj[id].value, this.format);                     // Отримуємо номер цільового біту
                                        buse = (this.orig.split('').reverse()[xbit] === '1');                       // отримаєсо ознаку його використання
                                        break;
                                    case 1:                                                                     // Для режиму входів
                                        if (this.setingsNum === di[1])                                              // Якщо призначений цей ввід
                                            buse = (this.obj[id].value === di[0]);                                      // Отримуємо ознаку використання напрямку (в value цих радіокнопок мають бути 'p' або 'i')
                                        break;
                                }
                                //--------------------
                                if (buse) {                                             // Якщо первинно ця радіокнопка була обрана
                                    this.obj[id].checked = true;                            // Обираємо її і тепер
                                    break;                                                  // Переходимо до наступної радіокнопки
                                }
                            }
                        }
                    }
                }
                else {                                                                              // Якщо група змінювалася
                    for (let id in this.obj) {                                                          // Перебираємо всі радіокнопки
                        if ((this.obj[id].name === name) && this.obj[id].value === this.last[radio_id]) {   // Якщо радіокнопка належить до цільової підгрупи та останнє значення було її значення
                            this.obj[id].checked = true;                                                        // Обираємо її
                            break;
                        }
                    }
                }
                break;
            case 'set_last':
                // Зберегти попереднє значення підгрупи цільової радіокнопки
                for (let id in this.obj)                                                                // Перебираємо всі радіокнопки
                    if (this.obj[id].name === name) this.last[id] = value;                                  // Встановлюємо для всіх радіокнопок цільової підгрупи останнє значення. Якась маячня !!!
                break;
        }
    }

    // Ініціалізація всієї групи радіокнопок
    initValue(value) {  // Прилітає побітове значення, як 00110110 дли типу 0 та i2/p3/p0 для типу 1
        let buse;
        let bok = false;
        switch (this.type) {
            case 0:                                                                 // Ініціалізація для типу 0 (Значення 00110110)
                if (checkBitsValue(value)) {                                            // Якщо значення нормальне
                    bok = true;
                    this.orig = value;                                                      // Зберігаємо його як є
                    value = value.split('').reverse();                                      // Створюємо масив з '1' та '0' та розвертаємо його

                    for (let id in this.obj) {                                              // Заповнюємо всі радіокнопки
                        let xbit = getBitByFormat(this.obj[id].value, this.format);             // Отримуємо номер біту, що відповідає радіокнопці
                        if (xbit !== null) {
                            xbit = value[xbit];                                                     // Отримуємо значення біту
                            if (this.last[id] === null) {                                           // Якщо радіо ще не змінювалося
                                buse = (xbit === '1');                                                      // Отримуємо ознаку використаності
                                this.obj[id].checked = buse;                                                // Встановлюємо/скидаємо піптик радіокнопці
                                console.log('Ініціалізація елементу ' + id + ' значенням [' + buse + ']');
                            }
                        }
                    }
                    for (let id in this.obj) {                                              // По значенням радіокнопок встаноалюєм чекбокси та доступність підгрупи
                        buse = (this.getValue(id,'value_by_name') !== null);             // Чекбокс буде обраний, якщо хочаб одна з радіокнопок підгрупи обрана
                        this.obj_main_checkbox[id].checked = buse;                              // Обираю/Знімаю чекбокс
                        this.change(id, true);                                    // Змінюю доступність радіокнопок підгрупи
                    }
                }
                break;
            case 1:                                                                 // Ініціалізація для типу 1 (Значення i2/p3/p0)
                if (checkAnswerWithDI(value, true)) {                       // Якщо значення нормальне
                        bok = true;
                        this.orig = value;                                                  // Збергаємо його як є
                        let id1 = null;                                                     // Створюю змінні id1, для чогось
                        for (let id in this.obj) {                                          // Перебираю всі id радіокнопок
                            if (this.last[id] === null) {                                       // Якщо значення підгрупи не змінювалося
                                if (id1 === null) id1 = id;                                         // Один раз зберігаю в id1 id першої не зміненої радіокнопки, Бляяяяя, А-А-А-А-А-А-А-А.!!! Я не розумію, як воно робить
                                buse = ((value[1] === this.setingsNum) && (value[0] === this.obj[id].value));   // Радіо буде обране якщо зчитаний номер дорівнює цільовому входу і зчитаний напрямок дорівнює напрямку радіо
                                this.obj[id].checked = buse;                                                    // Встановлюємо/Скидаємо піптик радію
                                console.log('Ініціалізація елементу ' + id + ' значенням [' + buse + ']');
                            }
                        }
                        this.obj_main_checkbox[id1].checked = (value[1] === this.setingsNum);   // Чекбокс встановлюю, якщо вхід використовується
                        this.change(id1, true);                                    // Змінюю доступність радіокнопок підгрупи
                }
                break;
        }
        if (!bok) console.log('Значення [' + value + '] не корректне для radio елементів групи ' + this.objectid + '. Елементи не ініціалізуються');
    }


    reinit() {
        this.orig = this.getValue('','result_value');
        for (let id in this.obj) this.last[id] = null;
    }

    save() {
        const change = this.changed();
        let value = this.getValue('','result_value');
        if (change) requestSaveValue(this, value);
        return change ? 1 : 0;                                  // Вертати кількість змінених біт можна (для бітового формату), але змісту поки що не бачу
    }

    changed() {
        let change;
        let value = this.getValue('','result_value');
        switch (this.type) {
            case 0:                                             // Для побітового формату
                if (this.orig === null) {                           // Для неініціалізованої групи
                    for (let id in this.obj) {                          // Серед усіх радіо
                        change = (this.last[id] !== null);                  // Змінена та, яка змінювалася
                        if (change) break;
                    }
                }
                else {                                              // Для ініціалізованої групи
                    change = (value !== this.orig);                     // Змінена та, яка змінилася
                }
                break;
            case 1:                                             // Для формату входів
                if (this.orig === null) {                           // Для неініціалізованої групи
                    for(let id in this.obj) {                           // Отримуємо id першого радіо
                        change = this.last[id] !== null;                    // Знмінений, якщо змінювався
                        break;
                    }
                }
                else {                                              // Для ініціалізованої групи
                    change = (this.orig !== value);                     // Змінений, якщо змінився
                }
                break;
        }
        return change;
    }

    change(radio_id, main_checkbox=false) {
        if (main_checkbox) {                                                                            // Якщо змінений головний чекбокс
            const buse = this.obj_main_checkbox[radio_id].checked;
            setEnableElements(this.getValue(radio_id,'idlist_by_name'), buse);                       // Змінюємо доступність радіокнопок
            if (buse) {                                                                                    // Якщо чекбокс обрано
                this.setValue(radio_id, 'restore_last');                                                // Відновлюємо попореднє значення
                const value = this.getValue(radio_id,'value_by_name');                                  // Беремо це значення
                if (value === null) {                                                                         // Якщо значення ще немає
                    this.obj[radio_id].checked = true;                                                            // Примусово обираємо відому радіокнопку
                    this.setValue(radio_id, 'set_last', this.obj[radio_id].value);                         // Зберігаємо нове останнє значення в об'єкті
                }
            }
            else {                                                                                         // Якщо чекбокс знято
                this.setValue(radio_id, 'reset_by_name');                                               // Знімаємо піптики з усіх радіо
            }
        }
        else {                                                                                          // Якщо змінена радиокнопка
            this.setValue(radio_id, 'set_last', this.getValue(radio_id,'value_by_name'));      // Записуємо в last всіх радіокнопок с іменем как у radio_id значення value обраної кнопки
        }
    }
}
