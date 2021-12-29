'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                Клас опису об'єкт текстбокса для вводу довільного тексту довжиною не більше 16 символів
 ----------------------------------------------------------------------------------------------------------------------
 Клас описує об'єкт, який являє собою один текстбокс на html сторінці, що мможе вміщати 16 символів
 key           - Ключ Modbus значення, що надсилається у запиті до пристрою та значення якого як є необхідно вивести на сторінку.
 obj_id        - id текстбокса (елементу input типу text) на html сторінці
 isDSH         - Ознака того, що в полі буде назва Дешунтування, ка не вичитується з пристрою та не може бути змінена.
 info_label_id - id мітки (елементу label, span ) на html сторінці в яку під час вводу виводиться кількість доступних символів
 group_list    - список елементів html сторінки, які мають бути не редагуємими для назви Дешунтування
----------------------------------------------------------------------------------------------------------------------*/
class NameEdit  {
    constructor (key, obj_id, isDSH, info_label_id, group_list=[]) {
        this.key = key;
        this.obj = getElementEx('Конструктор NameEdit', obj_id);
        this.obj_label = getElementEx('Конструктор NameEdit', info_label_id);
        this.objectid = obj_id; //this.obj.id;
        this.orig = null;
        this.last = null;
        this.editable = !isDSH;
        if (this.editable) {
            requestOriginValue(this);
        }
        else {
            this.initValue('Дешунтування');
            setEnableElements(group_list, false);
        }
    }

    change() {
        let realChange;
        if (this.last === null)
            realChange = true;
        else
            realChange = (this.obj.value !== this.last);
        if (realChange) {
            let value = this.obj.value;
            if (value.length <= 16) {
                if (this.last === null) {
                    if (this.orig === null)
                        this.last = value;
                    else
                        this.last = this.orig;
                }
                else {
                    this.last = value;
                }
            }
            else {
                this.obj.value = value.substr(0, 16);
                this.last = this.obj.value;
            }
            this.outInfo();
        }
    }


    initValue(value) {
        this.orig = value;
        if (value.length > 16) {
            console.log('Зчитане значення довше 16 символів, що не можливо, але є і буде обрізане до 16 символів');
            value = value.substr(0,16);
        }
        if (this.last === null) {
            this.obj.value = value;
            this.outInfo();
            console.log('Ініціалізація елементу ' + this.obj.id + ' значенням [' + value + ']');
        }
    }

    outInfo() {
        const value = this.obj.value;
        this.obj_label.innerText = (value.length === 16) ? ('Максимальна довжина назви') : ('Доступно ' + (16 - value.length) + ' символів');
    }


    reinit() {
        this.last = null;
        this.orig = this.obj.value;
    }

    save() {
        const change = this.changed();
        if (change) requestSaveValue(this, this.obj.value);
        return change ? 1 : 0;
    }

    changed() {
        let change = false;
        if (this.orig === null)                         // Не ініціалізовані
                change = (this.obj.value !== '');           // Будь - яке значення
            else                                        // Ініціалізовані
                change = (this.obj.value !== this.orig);    // Тільки якщо змінені
        return change;
    }
} // Кінець класу NameEdit
