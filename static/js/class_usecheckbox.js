'use strict';
/*----------------------------------------------------------------------------------------------------------------------
 Клас описує об'єкт чекбокса, що описує використовується чи не використовується якийсь параметр. Розширено до 2-х типів
  0. Класичний - приймає тільки 1 або 0 (не бітовий формат). Має групу пов'язаних з ним елементів
  1. Використання входу - приймає p0/p1/p2/p3/p4.
 ----------------------------------------------------------------------------------------------------------------------
 key       - Ключ Modbus багатобітового значення, що надсилається у запиті до пристрою та значення якого необхідно вивести
             на сторінку у вигляді checkbox.
 obj_id    - id чекбокса (елементу input типу checkbox) на html сторінці
 add_obj_id - перелік id додаткових елементів, доступність яких змінюється синхронно вибору/зняттю галки чекбокса
 settingNum - тільки для 1-го типу чекбокса, містить в собі номер цільового для об'єкту номеру входу
 source_type - тільки для 1-го типу чекбокса, містить номер типу (0/1) об'єкту чекбоксу
 ext_mechanic - назва алгоритму, який буде виконаний після ініціалізації значення об'єкту
----------------------------------------------------------------------------------------------------------------------*/
class UseCheckbox {
    constructor (key, obj_id, add_obj_id = null, settingNum = null, source_type = 0, ext_mechanic=null) {
        this.key = key;
        this.obj = getElementEx('Конструктор UseCheckbox', obj_id);
        this.objectid = obj_id;
        this.orig = null;
        this.last = null;
        this.settingNum = settingNum;
        this.type = source_type;        // Тип джерала: 0 - 0/1, класичний use, 1 - p0/p4 - для номера входу, 2 - для режиму АПВ
        this.add_id = add_obj_id;       // Щоб знати кому динамічно змінювати доступність
        this.ext_mechanic = ext_mechanic;
        if (this.key === '')
            this.initValue('0');
        else
        requestOriginValue(this);

    }

    initValue (value) {
        let bok, buse;
        switch (this.type) {
            case 0:                                     // Для класичного use
                bok = (['0', '1'].indexOf(value) >= 0);
                if (bok) buse = (value === '1');
                break;
            case 1:                                     // Для use дискретного входу
                bok = checkDInumber(value);
                if (bok) buse = (value[1] === this.settingNum);
                break;
            case 2:                                     // Для use режиму АПВ
                bok = (['0', '1', '2'].indexOf(value) >= 0);
                if (bok) buse = (value !== '0');
        }
        if (bok) {
            this.orig = value;
            if (this.last === null) {
                this.obj.checked = buse;
                console.log('Ініціалізація елементу ' + this.obj.id + ' значенням [' + buse + ']');
                setEnableElements(this.add_id, this.obj.checked);
                this.mechanic();
            }
        }
        else {
            console.log('Значення [' + value + '] не корректне для елементу ' +this.obj.id + '. Елемент не ініціалізується');
        }
    }

    mechanic() {
        switch (this.ext_mechanic) {
            case 'chkbxUseMSZ1':
                if (this.orig === '1') {
                    htmlObjects['spnI_MSZ1'] = new StaticSpan('MSZ1_Iwork', 'spnI_MSZ1', {});
                    htmlObjects['spnT_MSZ1'] = new StaticSpan('MSZ1_Twork', 'spnT_MSZ1', {});
                }
                break;
            case 'chkbxUseMSZ1':
                if (this.orig === '1') {
                    htmlObjects['spnI_MSZ1'] = new StaticSpan('MSZ1_Iwork', 'spnI_MSZ1', {});
                    htmlObjects['spnT_MSZ1'] = new StaticSpan('MSZ1_Twork', 'spnT_MSZ1', {});
                }
                break;
            case 'chkbxUseMSZ2':
                if (this.orig === '1') {
                    htmlObjects['spnI_MSZ2'] = new StaticSpan('MSZ2_Iwork', 'spnI_MSZ2', {});
                    htmlObjects['spnT_MSZ2'] = new StaticSpan('MSZ2_Twork', 'spnT_MSZ2', {});
                }
                break;
            case 'chkbxUseSV1':
                if (this.orig === '1') {
                    htmlObjects['spnI_SV1'] = new StaticSpan('SV1_Iwork', 'spnI_SV1', {});
                    htmlObjects['spnT_SV1'] = new StaticSpan('SV1_Twork', 'spnT_SV1', {});
                }
                break;
            case 'chkbxUseSV2':
                if (this.orig === '1') {
                    htmlObjects['spnI_SV2'] = new StaticSpan('SV2_Iwork', 'spnI_SV2', {});
                    htmlObjects['spnT_SV2'] = new StaticSpan('SV2_Twork', 'spnT_SV2', {});
                }
                break;
            case 'chkbxUseZNZ1':
                if (this.orig === '1') {
                    htmlObjects['spnI0_ZNZ1'] = new StaticSpan('ZNZ1_Iwork', 'spnI0_ZNZ1', {});
                    htmlObjects['spnU0_ZNZ1'] = new StaticSpan('ZNZ1_Uwork', 'spnU0_ZNZ1', {});
                    htmlObjects['spnT_ZNZ1'] = new StaticSpan('ZNZ1_Twork', 'spnT_ZNZ1', {});
                }
                break;
            case 'chkbxUseZNZ2':
                if (this.orig === '1') {
                    htmlObjects['spnI0_ZNZ2'] = new StaticSpan('ZNZ2_Iwork', 'spnI0_ZNZ2', {});
                    htmlObjects['spnU0_ZNZ2'] = new StaticSpan('ZNZ2_Uwork', 'spnU0_ZNZ2', {});
                    htmlObjects['spnT_ZNZ2'] = new StaticSpan('ZNZ2_Twork', 'spnT_ZNZ2', {});
                }
            case 'chkbxUseZZ':
                if (this.orig === '1') {
                    htmlObjects['spnDI_ZZ'] = new StaticSpan('ZZ_SourceDI','spnDI_ZZ',{}, null, null, null, null, 'spnDI_ZZ');
                    htmlObjects['spnT_ZZ'] = new StaticSpan('ZZ_Twork', 'spnT_ZZ', {});
                }
            case 'chkbxUseACHR':
                if (this.orig === '1') {
                    htmlObjects['spnDI_ACHR'] = new StaticSpan('ACHR_SourceDI','spnDI_ACHR',{}, null, null, null, null, 'spnDI_ACHR');
                }
            case 'chkbxUseAPV':
                if (this.orig !== '0') {
                    htmlObjects['spnMode_APV'].initValue(this.orig, true, false);
                }
        }
    }


    getValue() {
        switch (this.type) {
            case 0:
            case 2:         // Важливо знати тільки обрана чи ні. Таке як для 0, але логіка різна.
                return this.obj.checked ? '1': '0';
            case 1:
                return 'p' + (this.obj.checked ? this.settingNum : '0');
        }
    }

    reinit() {
        this.last = null;
        this.orig = this.getValue();
    }

    save() {
        const change = this.changed();
        if (change) requestSaveValue(this, this.getValue());
        return change ? 1 : 0;
    }

    changed() {
        let change = false;
        // if (this.key === '') return change;            // Використано в: settingsDATETIMEpeprepate для chkbxSyncForAllDevices, mainPrepare для chkbxUseAPV
        if (! this.obj.disabled) {                        // Перевіряємо тільки активні елементи
            if (this.orig === null) {                        // Для не ініціалізованих
                change = (this.last !== null);                  // Якщо змінювалися
            }
            else {                                           // Для ініціалізованих
                let value = this.getValue();        // Отримаємо значення із чекбокса
                switch (this.type) {
                    case 0:
                        change = (value !== this.orig);                 // Тільки якщо змінені
                        break;
                    case 1:
                        if (value[1] === '0')                           // Якщо чекбокс не обраний
                            change = (this.orig[1] === this.settingNum);         // Тільки якщо він був обраний
                        else                                            // Якщо чекбокс обраний
                            change = (value !== this.orig);                 // Тільки якщо змінений
                        break;
                    case 2:                                             // Для режиму АПВ. Галка працює тільки на вимкнення АПВ. Режим обирається в формі налаштування АПВ
                        if (this.orig !== null)
                            change = (this.orig !== '0') && (value === '0');
                }
            }
        }
        return change;
    }

    change() {
        if (this.key === '') {
            if (this.obj.checked) alert('Щоб оце дрантя працювало - треба дописувати нестандартну функцію ' +
                '10 протоколу modbus :-(')
        }

        this.last = this.getValue();
        setEnableElements(this.add_id, this.obj.checked);
    }
} // Кінець класу UseCheckbox
