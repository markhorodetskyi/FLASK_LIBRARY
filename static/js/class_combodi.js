'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                             Клас описує combobox для вибору входів з інверсією та без.
!!! Тут треба би було ще задіяти min-max із mobus, та динамічно будувати <option> в елементі <select> з вказаним obj_id,
але наразі я не знаю як туво робити, тому я їх навіть не отримую як аргументи конструктора
 ----------------------------------------------------------------------------------------------------------------------
 key            - Ключ Modbus, що надсилається у запиті до пристрою та дані з якого необхідно вивести на сторінку.
 obj_id         - id комбобокса (елементу select) на html сторінці у якого є 4 options
 main_chkbox_id - не обов'язковий id чекбокса (елементу input типу checkbox) на html сторінці, який не має власного
                  джерела даних а заповнюється алгортимічно в залежності від зчитаного/введеного значення номеру входу
                  (для візуального спрощення сприйняття використовується вхід чи ні)
 inv_chkbox_id  - не обов'язковий id чекбокса (елементу input типу checkbox) на html сторінці, який визначає
                  використання інверсії сигналу на обраному вході
----------------------------------------------------------------------------------------------------------------------*/
class ComboDI {
    constructor(key, obj_id, main_chkbox_id, inv_chkbox_id) {
        this.key = key;
        this.objectid = obj_id;
        this.obj = getElementEx('Конструктор ComboDI', obj_id);
        this.obj_main_checkbox = null;
        if (main_chkbox_id !=='') this.obj_main_checkbox = getElementEx('Конструктор ComboDI', main_chkbox_id);
        this.obj_inv_checkbox = null;
        if (inv_chkbox_id !=='') this.obj_inv_checkbox = getElementEx('Конструктор ComboDI', inv_chkbox_id);
        this.last = null;
        this.lastinv = null;
        this.orig = null;
        this.originv = null;
        // this.min = 0;       // !!! Із modbusmap
        // this.max = 4;       // !!! Із modbusmap
        requestOriginValue(this);
    }

    initValue(value) {
        if (checkAnswerWithDI(value, this.obj_inv_checkbox !== null)) {
            let invsignal = (value[0] === 'i');
            let dinum = parseInt(value[1]);
            this.orig = dinum;
            if (this.last === null) {
                this.obj.selectedIndex = dinum;
                console.log('Ініціалізація елементу ' + this.obj.id + ' індексом [' + dinum + ']');
                this.change('combo', true);
                this.last = null;
            }
            if ((this.lastinv === null) && (this.obj_inv_checkbox !== null)) {
                this.obj_inv_checkbox.checked = invsignal;
                this.originv = invsignal;
                console.log('Ініціалізація елементу ' + this.obj_inv_checkbox.id + ' значенням [' + invsignal + ']');
            }
        }
        else {
           console.log('Значення входу сигналу [' + value + '] не корректне для елементу [' +this.objectid + ']');
        }
    }

    reinit() {
        this.last = null;
        this.orig = this.obj.selectedIndex;
        this.lastinv = null;
        if (this.obj_inv_checkbox !== null)
            this.originv = this.obj_inv_checkbox.checked;
    }

    save() {
        const change = this.changed();
        if (change) requestSaveValue(this, this.getValue());
        return change ? 1 : 0;
    }

    changed(xelem_pos=null) {
        if (xelem_pos === null) {
            const changeDI = this.changed(0);
            const changeInv = this.changed(1);
            return changeDI || changeInv;
        }
        else {
            let change = false, value;
            if (xelem_pos === 0) {
                value = this.obj.selectedIndex;         // Отримаємо значення із комбобокса
                if (this.orig === null)                 // Для не ініціалізованих
                    change = (this.last !== null);          // Якщо змінювалися
                else                                    // Для ініціалізованих
                    change = (value !== this.orig);         // Тільки якщо змінені
                return change
            }
            else {
                if (this.obj_inv_checkbox !== null) {           // Якщо чекбокс інверсії існує
                    value = this.obj_inv_checkbox.checked;       // Отримуємо значення чекбоксу інверсії
                    if (this.originv === null)                   // Для не ініціалізованого
                        change = (this.lastinv !== null);            // Якщо змінювався
                    else                                         // Для ініціалізованого
                        change = (value !== this.originv)            // Якщо змінився
                }
                return change;
            }
        }
    }

    getValue() {
        if ((this.obj_inv_checkbox === null) || (this.obj.selectedIndex === 0))
            var prefix = 'p';
        else
            prefix = this.obj_inv_checkbox.checked ? 'i' : 'p';
        return prefix + this.obj.selectedIndex;
    }

    change(who, asinit = false) {
        let group = [this.obj.id];
        if (this.obj_inv_checkbox !== null) group.push(this.obj_inv_checkbox.id);

        switch (who) {
            case 'main':
                setEnableElements(group, this.obj_main_checkbox.checked);                       // Елементи доступні, якщо чекбокс обраний
                if (this.obj_main_checkbox.checked) {                                           // Якщо чекбокс обраний
                    if (this.last !== null)                                                         // Якщо номер входу змінювався вручну
                        this.obj.selectedIndex = this.last;                                             // Вертаємо останній обраний номер
                    else if (this.orig !== null)                                                    // Якщо номер входу був зчитаний
                        this.obj.selectedIndex = this.orig;                                             // Вертаємо зчитаний номер
                    //-----
                    if (this.obj_inv_checkbox !== null) {                                           // Якщо є чекбокс інверсії
                        if (this.lastinv !== null)                                                      // Якщо інверсія змінювалася
                            this.obj_inv_checkbox.checked = this.lastinv;                                   // Вертаємо останню інверсію
                        else if (this.originv !== null)                                                 // Якщо інверсія була зчитана
                            this.obj_inv_checkbox.checked = this.originv;                                   // Вертаємо зчитану інверсію
                    }
                }
                else {                                                                          // Якщо чекбокс знятий
                    this.obj.selectedIndex = 0;                                                     // Прибираємо номер входу
                    if (this.obj_inv_checkbox !== null) this.obj_inv_checkbox.checked = false;      // Скидаємо чекбокс інверсії, якщо він є
                }
                break;
            case 'combo':
                if (!asinit) this.last = this.obj.selectedIndex;                                                        // Змінене вручну значення зберігаємо як останнє
                if (this.obj_main_checkbox !== null) this.obj_main_checkbox.checked = (this.obj.selectedIndex !== 0);   // Встаноалюємо значення головного чекбоксу, якщо він є
                if (this.obj.selectedIndex === 0)                                                                       // Якщо вхід не обрано
                    if (this.obj_inv_checkbox !== null) this.obj_inv_checkbox.checked = false;                          // Скидаємо чекбокс інверсії якщо він є
                const  enb = (this.obj_main_checkbox === null) ? true : (this.obj.selectedIndex !== 0);                 // Якщо головного чекбокса немає, група доступна
                setEnableElements(group, enb);                                                                          // Встановлюємо доступність комбо бокса та чекбокса інверсії
                break;
            case 'inv':
                    this.lastinv = this.obj_inv_checkbox.checked;
                break;
        }
    }

} // Кінець класу ComboDI
