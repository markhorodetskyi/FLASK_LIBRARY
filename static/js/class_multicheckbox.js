'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                       Клас описує групу чекбоксів, які мають один ключ modbus джерела
 ----------------------------------------------------------------------------------------------------------------------
 key           - Ключ Modbus, що надсилається у запиті до пристрою та дані з якого необхідно вивести на сторінку.
 obj_id        - унікальний ідентифікатор, що описує об'єкт в глобальному масиві (Такий елемент на html сторінці відсутній)
 sources       - словник з ключами: ідентифікатор чекбоксів на html сторінці та значеннями - строка джерел збудження відповідних чекбоксів
 save_as_source: true - для сторінок налаштування захистів, де використано 1(2) джерела спрацювання виконавчого елементу.  {Джерело:1}
                 false - для сторінок налаштування виконавчого елементу (KL, VD, осцилограф). перезапис всіх джерел відразу (00111011001)
 mechanic_name - Назва алгоритму, який буде виконуватися щоразу при зміні буль-якого чекбокса в групі
----------------------------------------------------------------------------------------------------------------------*/
class MultiCheckbox {
    constructor(key, obj_id, sources, bitformat, save_as_source = true, mechanic_name='') {
        this.key = key;
        this.objectid = obj_id;
        this.obj = {};
        this.last = {};
        this.orig = {};
        this.savedval = {};
        for (let id in sources) {
            this.obj[id] = getElementEx('Конструктор MultiCheckbox', id);
            this.last[id] = null;
            this.orig[id] = null;
            this.savedval[id] = null;   // Так як id зміненого чекбокса не передається прямо, для того щоб дізнатись це id - буду шукати це значення черед об'єктів
        }
        this.src = sources;             // Словник id всіх чекбоксів та їх збудників
        this.format = bitformat;
        this.writesource = save_as_source;  // Ознака, зберігати значення групи значенням (якщо група описує всі джерела) чи одиночним джерелом
        this.groupmode = true;              // То є недороблена фіча
        this.mechanic = mechanic_name;      // Функція, що виконується при зміні значення (Для перевірки значень)
        requestOriginValue(this);
    }

    // Ініціалізація всієї групи чекбоксів
    initValue(value) {  // Прилітає побітове значення, як 00110110
        if (checkBitsValue(value)) {
            value = value.split('').reverse();
            for (let id in this.src) {                                       // Перебираю всі ключі (id чекбоксів)
                let xbit = getBitByFormat(this.src[id], this.format);            // Отримую номер біту
                if (xbit !== null) {
                    xbit = value[xbit];                     // Отримуємо значення біту ('1' або '0')
                    this.orig[id] = xbit;
                    if (this.last[id] === null) {
                        this.obj[id].checked = (xbit === '1');
                        console.log('Ініціалізація елементу ' + id + ' значенням [' + (xbit === '1') + ']');
                    }
                }
            }
        }
        else {
            console.log('Значення [' + value + '] не корректне для checkbox елементів групи ' + this.objectid +
                '. Елементи не ініціалізуються');
        }
    }

    reinit(asValue=true) {                                      // Реініт викликається, щоразу як зберігається один чекбокс
        for (let id in this.src) {                              // Всі чекбокси
            console.log('id =' + id + ', savedval=' + this.savedval[id]);
            if ((this.savedval[id] === 'save') || asValue) {        // Якщо збереження оброблене (успішно/не успішно) або зберігалося групою
                this.savedval[id] = null;
                this.last[id] = null;                                   // Виконуємо переініціалізацію
                this.orig[id] = this.obj[id].checked ? '1' : '0';
                console.log('id' + id +' reinit to new value=' + this.orig[id]);
            }
        }
    }

    save() {
        let change, value, retval = 0;
        if (this.writesource) {
            // Запис всієї групи здійснюється почергово для кожного чекбокса в форматі Джерело:значення
            // (Для збереження значення конкретного джерела)
            for (let id in this.src) {
                change = this.changed(id);
                if (change) {
                    value = '{' + this.src[id] + ':' + (this.obj[id].checked ? '1' : '0') + '}';
                    this.savedval[id] = value;
                    console.log('1. Save in ' + id +' value [' + value +']');
                    requestSaveValue(this, value);
                    retval++;
                }
            }
        }
        else {
            // Запис всієї групи має здійснюватися одгим значенням при зміні будь чого (Джерела пуску КЛ, осцилографа,
            // VD з форми налаштування КЛб осцилографа, VD відповідно)
            retval = this.changed();
            if (retval > 0) {
                let value = '0000000000000000'.split('');
                for (let id in this.src) {                                       // Перебираю всі ключі (id чекбоксів)
                    let xbit = getBitByFormat(this.src[id], this.format);            // Отримую номер біту
                    if (xbit !== null) value[xbit] = this.obj[id].checked ? '1' : '0';
                }
                value = value.reverse().join('');
                requestSaveValue(this, value);
            }
        }
        return retval;
    }

    changed(id=null) {
        if (id === null) {
            let changeCount = 0;
            for (let xid in this.src)
                if (this.changed(xid)) changeCount++;
            return changeCount;                     // Вертаємо кількість змін (для всієї групи)
        }
        else {
            let change = false;
            if (!this.obj[id].disabled) {                            // Перевіряємо тільки активні елементи
                const value = this.obj[id].checked ? '1' : '0';        // Отримаємо значення із чекбокса
                if (this.orig[id] === null)                              // Для не ініціалізованих
                    change = (this.last[id] !== null);                       // Якщо змінювалися
                else                                                    // Для ініціалізованих
                    change = (value !== this.orig[id]);                      // Тільки якщо змінені
            }
            return change;                          // Вертаємо ознаку зміни (для окремого елементу)
        }
    }

    change(id) {
        this.last[id] = this.obj[id].checked;
        if (this.mechanic !== '') this.mechanic_on_change(this.mechanic, id);
    }

    groupset() {
        if (this.groupmode) {
            for (let id in this.obj) {
                this.obj[id].checked = !this.obj[id].checked;
                this.change(id);
            }
        }
        else {
            let value = Object.keys(this.obj)[0];
            value = this.obj[value].checked;            // Отримуємо значення першого чекбоксу
            for (let id in this.obj) {
                this.obj[id].checked = !value;
                this.change(id);
            }
        }
    }

    changeGroupMode() {
        this.groupmode = !this.groupmode;
        console.log('Для групи ' + this.objectid + ' режим групового інвертування змінений на ' + (this.groupmode ? 'індивідуальний' : 'груповий'));
    }

    mechanic_on_change(algName, obj_id) {
        switch (algName) {
            case 'MechanicResetKL4':                            // Функція реалізує механіку не допущення зняття обидвох сигналів скидання
                let buse;
                for (let id in this.obj) {
                    buse = this.obj[id].checked;
                    if (buse) break;
                }
                if (!buse) {
                    for (let id in this.obj) {
                        if (id !== obj_id) {
                            this.obj[id].checked = true;
                            this.change(id);
                            break;
                        }
                    }
                }
                break
        }
    }

} // Кінець класу MultiCheckbox
