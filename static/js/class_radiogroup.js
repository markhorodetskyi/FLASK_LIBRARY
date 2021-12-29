'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                             Клас описує радіогрупу з довільною кількістю опцій.
 На сторінці всі елементи (input типу radio мають) мати параметри values. Так як звернення до елемена здійснюється по імені
 групи, а значення читаєтьс із value конкретної радіокнопки - створив методи отримання та запису значення.
 Параметр id потрібен тільки для агрументу for описової мітки
 ----------------------------------------------------------------------------------------------------------------------
  key       - Ключ Modbus, що надсилається у запиті до пристрою та значення якого інтерпретується в радіогрупу
  obj_id    - name всіх елементів радіогрупи (елементи input типу radio, спільне для всіх) на html сторінці
  mechanic_name - назва алгоритму, що реалізує логіку поведінки пов'язаних елементів на сторінці
----------------------------------------------------------------------------------------------------------------------*/
class RadioGroup {
    constructor (key, obj_name, mechanic_name='') {
        this.key = key;
        this.objectid = obj_name;
        this.obj = getElementEx('Конструктор RadioGroup', obj_name, true);  // Тут буде список елементів
        this.last = null;
        this.orig = null;
        this.mechanic = mechanic_name; // Зовнішня функція, що реалізує поведінку елементів сторінки при зміні радіокнопки
        if (this.key !== '')
            requestOriginValue(this);
        else
            this.initValue('Random');
    }

    setValue(value) {
        for (let radio of this.obj) {
            radio.checked = (radio.value === value);
            if (radio.checked) break;
        }
    }

    getValue() {
        for (let radio of this.obj) {
            if (radio.checked) return radio.value;
        }
        return null;
    }

    initValue(value) {  // Переірка значення та ініціалізація елементу на формі
        let bsucc;
        for (let radio of this.obj) {
            bsucc = (value === radio.value);
            if (bsucc) break;
        }
        if (bsucc) {
            this.orig = value;
            if (this.last === null) {
                this.setValue(value);
                console.log('Ініціалізація елементу ' + this.objectid + ' значенням [' + value + ']');
            }
        }
        else {
            console.log('Значення [' + value + '] не корректне для елементу ' + this.objectid + '. Елемент не ініціалізується');
        }
        if (this.mechanic !== '') this.mechanic_on_change(this.mechanic);
    }

    reinit() {
        this.last = null;
        this.orig = this.getValue();
    }

    save() {
        if (this.key === "") return 0;
        const change = this.changed();
        if (change) requestSaveValue(this, this.getValue());
        return change ? 1 : 0;
    }

    changed() {
        let change;
        const value = this.getValue();
        // console.log('value = ' + value + ', last = ' + this.last + ', orig = ' + this.orig);
        change = (value !== this.orig);         // Якщо змінилося
        return change;
    }

    change() {
        this.last = this.getValue() ;
        if (this.mechanic !== '') this.mechanic_on_change(this.mechanic);
    }

    mechanic_on_change (algName) {
        let mval, slist ;
        switch (algName) {
            // Функція реалізує механіку доступності деяких елементів форми при зміні логіки та режиму роботи КЛ-1,2,3
            // Вибір логіки доступний завжди, Вибір режиму не доступний для логіки на включення
            // Час включення доступний для [1. логіки на включення/не відомої], [2. Логіки на відключення в імпульсному або не проініціалізованому режимі]
            // Час затримки відключення доступний для [Логіки на відключення/не выдомої в потенціальному або не проініціалізованому режимі]
            case 'MechanicKL123LogicMode':
                const lval = htmlObjects['LogicKL'].getValue();
                mval = htmlObjects['ModeKL'].getValue();
                const bmode_enable = (lval !== '1');
                const btimeon_enable = (bmode_enable && (mval !== '0') || (lval !== '0'));
                const btimeoff_enable = (bmode_enable && (mval !== '1'));
                setEnableElements(['ModeKL0', 'ModeKL1'], bmode_enable);
                setEnableElements(['lblTimeOn', 'btnDownTimeOn', 'edtTimeOn', 'btnUpTimeOn'], btimeon_enable);
                setEnableElements(['lblTimeOffDelay', 'btnDownTimeOffDelay', 'edtTimeOffDelay', 'btnUpTimeOffDelay'], btimeoff_enable);
                break;
            case 'MechanicApvMode':
                // Функція реалізує механіку доступності деяких елементів форми при зміні режиу АПВ
                // Друга затримка не доступна для однократного АПВ
                mval = htmlObjects['apvMode'].getValue();
                slist = ['lblTimeWait2', 'btnDownTimeWait2', 'edtTimeWait2', 'btnUpTimeWait2'];
                setEnableElements(slist, mval !== '1');
                break;
            case 'MechanicSyncTimeMode':
                slist = ['edtDay','edtMonth','edtYear','edtHour','edtMin','edtSec',
                    'btnDayDown','btnMonthDown','btnYearDown','btnHourDown','btnMinDown','btnSecDown',
                    'btnDayUp','btnMonthUp','btnYearUp','btnHourUp','btnMinUp','btnSecUp'];
                mval = this.getValue();
                setEnableElements(slist, mval === 'Random');
            break;
        }
    }
}       // Кінець класу RadioGroup
