'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                                Клас описує combobox для характеристик реле МСЗ
 ----------------------------------------------------------------------------------------------------------------------
 key            - Ключ Modbus, що надсилається у запиті до пристрою та дані з якого необхідно вивести на сторінку.
 obj_id         - id комбобокса (елементу select) на html сторінці у якого є 5 options
----------------------------------------------------------------------------------------------------------------------*/
class ComboFeatures {
    constructor(key, obj_id) {
        this.key = key;
        this.objectid = obj_id;
        this.obj = getElementEx('Конструктор ComboFeatures', obj_id);
        this.last = null;
        this.orig = null;
        requestOriginValue(this);
    }

    initValue(value) {
        const features = {'Незалежна': 0, 'Нормально залежна': 1, 'Сильно залежна': 2, 'Аналог РТВ-1': 3, 'Аналог РТВ-4, РТ-80': 4 };
        if (value in features) {
            this.orig = value;
            if (this.last === null) {
                // this.obj.value = value;
                this.obj.selectedIndex = features[value];
                console.log('Ініціалізація елементу ' + this.obj.id + ' значенням [' + value + ']');
            }
        }
        else {
            console.log('Значення [' + value + '] не корректне для елементу ' + this.obj.id + '. Елемент не ініціалізується');
        }
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
        if (this.orig === null)                     // Не ініціалізовані
            change = (this.last !== null);              // Якщо змінювалися
        else                                        // Ініціалізовані
            change = (this.obj.value !== this.orig);    // Тільки якщо змінені
        return change;
    }

    change() {
        this.last = ! this.obj.value;

    }
} // Кінець класу ComboFeatures
