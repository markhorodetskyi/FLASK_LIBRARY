'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                          Клас описує один чекбокс що заповнюється бітом в задежності від джерела
 ----------------------------------------------------------------------------------------------------------------------
 Клас описує об'єкт, який являє собою один чекбокс на html сторінці, значення якого визначається одним бітом,
 багатобітового знчення
 key       - Ключ Modbus багатобітового значення, що надсилається у запиті до пристрою та значення одного біту з
             якого необхідно вивести на сторінку.
 obj_id    - id чекбокса (елементу input типу checkbox) на html сторінці
 source    - текстова константа, що описує значення та положення біту заданого бітового формату у багатобітовому значенні
 bitformat - текстова константа, що описує бітовий формат багатобітового значення. Номер формату повністю наслідується з
             інструкції до карти MODBUS виробника пристирою PC80-MP з додаванням слова "BIT" замість "F" та за необхідності ведучого нуля до номеру
----------------------------------------------------------------------------------------------------------------------*/
class BitSingleCheckbox {
    constructor(key, obj_id, source, bitformat) {
        this.key = key;
        this.objectid = obj_id;
        this.obj = getElementEx('Конструктор BitSingleCheckbox', obj_id);
        this.src = source;
        this.last = null;
        this.orig = null;
        this.format = bitformat;
        requestOriginValue(this);
    }

    initValue(value) {
        if (checkBitsValue(value)) {
            let xbit = getBitByFormat(this.src, this.format);
            if (xbit !== null) {
                xbit = value.split('').reverse()[xbit];
                this.orig = xbit;
                if (this.last === null) {
                    this.obj.checked = (xbit === '1');
                    console.log('Ініціалізація елементу ' + this.obj.id + ' значенням [' + (xbit === '1') + ']');
                }
            }
        }
        else {
            console.log('Значення [' + value + '] не корректне для елементу ' + this.obj.id + '. Елемент не ініціалізується');
        }
    }

    reinit() {
        this.last = null;
        this.orig = this.obj.checked ? '1': '0';
    }

    save() {
        const change = this.changed();
        if (change) {
            const value = '{' + this.src + ':' + (this.obj.checked ? '1' : '0') + '}';
            requestSaveValue(this, value);
        }
        return change ? 1 : 0;
    }

    changed() {
        let change = false;
        if (! this.obj.disabled) {                          // Перевіряємо тільки активні елементи
            const value = this.obj.checked ? '1' : '0';         // Отримаємо значення із чекбокса
            if (this.orig === null)                             // Для не ініціалізованих
                change = (this.last !== null);                      // Якщо змінювалися
            else                                                // Для ініціалізованих
                change = (value !== this.orig);                     // Тільки якщо змінені
        }
        return change;
    }

    change() {
        this.last = this.obj.checked;
    }
} // Кінець класу BitSingleCheckbox
