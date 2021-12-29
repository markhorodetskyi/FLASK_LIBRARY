'use strict'
/*----------------------------------------------------------------------------------------------------------------------
                Клас опису об'єкт текстбокса для вводу числа з боковими кнопками для зміни значення на крок
 ----------------------------------------------------------------------------------------------------------------------
 Клас описує об'єкт, який являє собою один текстбокс на html сторінці, в який передбачається вводити числа
 key        - Ключ Modbus, що надсилається у запиті до пристрою та інтерпретується як число, яке необхідно вивести на сторінку.
 obj_id     - id текстбокса (елементу input типу text) на html сторінці
 min        - мінімальне значення, що може бути введене в поле (має братися з modbus)
 max        - максимальне значення, що може бути введене в поле (має братися з modbus)
 step       - крок мінімальної зміни значення значеня кнопками (і має бути завкруглення, але ще не реалізоване)
 num_format - формат, до якого треба відформатувати текстове значення числа на onblur (ще не реалізовано)
----------------------------------------------------------------------------------------------------------------------*/
class NumEdit  {
    constructor (key, obj_id, min, max, step, num_format=null) {
        this.key = key;                             // Ключ Modbus
        this.obj = getElementEx('Конструктор NumEdit', obj_id); // Сам http елемент на сторінці
        this.objectid = obj_id;
        this.orig = null;                           // Значення, зчитане з пристрою. Тут заповнюється щоб не було пимилки при очікуванні
        this.last = null;                           // Останнє коректне значення (динамічне).
        this.min = min;                             // Мінімальне значення з Modbus
        this.max = max;                             // Максимальне значення з Modbus
        this.step = step;                           // Крок значень з Modbus
        this.format = num_format;                   // Формат для виводу числа (null - як є, 'xx' - не менше двох символів
        if (key !== '') requestOriginValue(this);
    }

    stepChange(directSign) {
        let value = Number(this.obj.value.replace(/\s+/g,''));  // Очистка від пробілів
        if (isNaN(value)) {                                     // Якщо значення - не число
            if (this.last === null) this.last = this.min;           // Якщо значення не мінялося - рахуємо мінімальне останнім коректним
            value = this.last;                                      // За значення беремо останнє коректне
        }
        if (directSign === 0) {                             // Не робоча гілка
            this.change();
        }
        else {                                              // Робоча гілка
            if (directSign > 0) value += this.step;
            else if (directSign < 0) value -= this.step;
            if (value > this.max) value = this.max;
            if (value < this.min) value = this.min;
            // const digs = (1 / this.step).toString().length - 1;
            // value = value.toFixed(digs);
            this.obj.value = this.formating(value);
            this.last = Number(value);
        }
    }

    formating(value) {
        switch (this.format) {
            case 'xx':
                value = twoSym(value);
                break;
            default:
                const digs = (1 / this.step).toString().length - 1;
                value = Number(value).toFixed(digs);
                break;
        }
        return value;
    }

    change() {
        const origval = this.obj.value;
        const value = origval .replace(/\s+/g,'');                          // Очистка від пробілів
        let res;
        if (value === '') {                                                     // Якщо значення порожнє
            if (this.orig === null) {                                               // Значення не ініціалізоване
                if (this.last !== null) {                                               // Значення змінювалося
                    res = this.last;                                             // Вертаємо останнє коректне
                }
            }
            else {                                                                  // Значення ініціалізоване
                res = (this.last === null) ? this.orig : this.last;          // Вертаємо або зчитане значення або останнє коректне
            }
        }
        else if (isNaN(value)) {                                                // Якщо введене сміття
            if (this.orig === null)                                                 // Значення не ініціалізоване
                res = (this.last === null) ? '' : this.last;                 // Очищуємо або вертаємо останнє коректне
            else                                                                    // Значення ініціалізоване
                res = (this.last === null) ? this.orig : this.last;           // Вертаємо або зчитане значення або останнє коректне
            this.last = Number(res);
        }
        else {                                                                  // Якщо введене число
            if (value < this.min)                                                   // Число замале
                res = this.min;                                              // Вертаємо мінімальне
            else if (value > this.max)                                              // Число завелике
                res = this.max;                                              // Вертаємо максимальне
            else if (res !== value)                                      // Число з пробілами
                res = value;                                                 // Вертаємо очищене значення
            this.last = Number(res);                                     // Зберігаємо це коректне значення
        }
        this.obj.value = this.formating(res);
        // !!! Іще треба додати перевірку на відповідність кроку, але то пізніше, бо зараз крок 0,01. Робиться завкругленням само
    }


    initValue(value) {
        let err = null;
        if (isNaN(value)) {
            err = ' ['+ value + '] не числове';
        }
        else {
            if ((this.min <= value) && (value <= this.max)) {
                this.orig = Number(value);
                if (this.last === null) {
                    this.obj.value = this.formating(value);
                    console.log('Ініціалізація елементу ' + this.obj.id + ' значенням [' + value + ']');
                }
            }
            else {
                err = ' ['+ value + '] виходить за допустимі межі [' + this.min +' - ' + this.max + ']';
            }
        }
        if (err !== null) console.log('Зчитане значення' + err + '. Елемент ' + this.obj.id + ' не ініціалізується');
    }

    reinit() {
        this.last = null;
        this.orig = Number(this.obj.value);
    }

    save() {
        const change = this.changed();
        if (change) requestSaveValue(this, Number(this.obj.value));
        return change ? 1 : 0;
    }

    changed() {
        let change = false;
        if (!this.obj.disabled) {                   // Не активні елементи не пишемо
            if (this.obj.value !== '') {                // Порожнє значення рахуємо не зміненис
                const value = Number(this.obj.value);       // Коректне числове значення
                if (this.orig === null)                     // Не ініціалізовані
                    change = true;                              // Вони вже змінені так як існують
                else                                        // Ініціалізовані
                    change = (value !== this.orig);             // Тільки якщо змінені
            }
        }
        return change;
    }
} // Кінець класу NumEdit
