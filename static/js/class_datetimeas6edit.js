'use strict';
/*----------------------------------------------------------------------------------------------------------------------
 Клас описує групу із 6-ти об'єктів типу NumEditв які завантажується поточна дата комп'ютера, яку можна змінювати і яка
 щосекундно збільшується. dict_pos - це масив, де його прозиція його відповідає позиції в даті, сформованій як
 dd-MM-yyyy-hh-mm-ss, починаючи з 0
 ----------------------------------------------------------------------------------------------------------------------
 key              - Ключ Modbus, що надсилається у запиті до пристрою, дані з якого необхідно вивести на сторінку.
 obj_id           - id текстового тегу (span, label) на html сторінці
 arr              - масив із 6-ти об'єктів класу NumEdit в послідовності День, місяць, Рік, Години, Хвилини, Секунди
 update_interval  - інтервал оновлення годинника в мілісекундах (стандартно 1 секунда)
 radio_name       - name об'єкту radiogroup (елемент input типу radio) на html сторінці, який не має власного джерела
                    даних, обирається вручну і визначає джерело часу для синхронізації
 device_time      - id текстового тегу (label, span)  на html сторінці, в якому буде йти годинник пристрою
 allcheckbox_id   - id чекбокса (елементу input типу checkbox) на html сторінці, який не має власного джерела даних,
                    встановлюється вручну і визначає метод синхронізації годинника (тільки для даного пристрою /
                    для всіх пристроїв). Функція "Для всіх пристроїв заткнута затичкою
----------------------------------------------------------------------------------------------------------------------*/
class DateTimeAs6Edit {
    constructor (key, obj_id, arr, update_interval, radio_name, device_time, allcheckbox_id) {
        this.key = key;                     // Тільки для збереження
        this.objectid = obj_id;
        this.obj = arr;
        this.forallid = allcheckbox_id;
        this.orig = null;
        this.radio = radio_name;
        this.devime = device_time;
        this.update_interval = update_interval;
        this.mechanic_val('initDateTimePK');
        this.command('startTimer');
    }

    // Перенаправлення в одноімениий метод об'єкту класу NumEdit
    stepChange(edit_id, directSign) {
        const pos = this.get_id_pos(edit_id);
        this.obj[pos].stepChange(directSign);
    }

    // Отримання позиції Edit'а в масиві (загальний варіант)
    get_id_pos(edit_id) {
        for (let i in this.obj)
            if (edit_id === this.obj[i].obj.id) return i;
        return -1;
    }

    // Перенаправлення в одноімениий метод об'єкту класу NumEdit
    change(edit_id) {
        const pos = this.get_id_pos(edit_id);
        this.obj[pos].change();
        // Перевіряємо дату і час, пропускаючи їх через об'єкт дати
        const oldval = this.collectValues();
        const dt = this.getDateFromValues(oldval);
        const newval = this.getValuesFromDate(dt);
        if (oldval.toString() !== newval.toString()) this.outValues(newval);
    }

    mechanic_val(mechanic) {
        let value;
        if (mechanic === null) mechanic = 'initDateTimePK';
        switch (mechanic) {
            case 'initDateTimePK':                                  // Формування дати та часу ПК
                value = this.getValuesFromDate(new Date());
                this.outValues(value, true);
                break;
            case 'updateDateTime':
                value = this.collectValues();
                const dt = this.getDateFromValues(value,1); // Збільшуємо час на секунду, заодно коректується не вірна дата
                value = this.getValuesFromDate(dt);
                this.outValues(value);
                break;
            default:
                console.log('Механіка [' + mechanic + '] не передбачена класом DateTimePK');
        }
    }

    // Функція збирає значення всіх полів в масив, приводячи їх до дозволених значень
    collectValues() {
        let value=[];
        for (let i in this.obj) {
            if (!checkNumber(this.obj[i].obj.value, this.obj[i].min, this.obj[i].max)) this.obj[i].change();
            value.push(this.obj[i].obj.value);
        }
        return value;
    }

    // Функція виводить значення з масиву в елементи форми
    outValues(value, init=false) {
        for (let i in this.obj) {
            if (init) {
                this.obj[i].initValue(value[i]);
            }
            else {
                this.obj[i].obj.value=value[i];
                this.obj[i].change();
            }
        }
    }

    // Функція створює об'єкт дати по даних в масиві [dd, MM, YYYY, hh, mm, ss]
    getDateFromValues(value, incSec=0) {
        return new Date(value[2], Number(value[1])-1, value[0], value[3], value[4], Number(value[5])+incSec);
    }

    // Функція створює масив даних [dd, MM, YYYY, hh, mm, ss] з дати
    getValuesFromDate(dt) {
        return [twoSym(dt.getDate()), twoSym(dt.getMonth()+1), dt.getFullYear(),
            twoSym(dt.getHours()), twoSym(dt.getMinutes()), twoSym(dt.getSeconds())];
    }


    // Функція вертає, об'єкт дати обраної для запису
    getValue() {
        const mode = htmlObjects[this.radio].getValue();
        let dt;
        switch (mode) {
            case 'PK':
                dt = new Date();
                break;
            case 'Random':
                const value = this.collectValues();
                dt = this.getDateFromValues(value);
                break;
            default:
                return null;
        }
        return dt;
    }

    // Функція із дати формує значення, готове для запису в пристрій
    exportDate(dt) {
        return '{' + twoSym(dt.getDate()) + '.' + twoSym(dt.getMonth()+1) + '.' + dt.getFullYear() + ' ' +
                twoSym(dt.getHours()) + ':' + twoSym(dt.getMinutes()) + ':' + twoSym(dt.getSeconds()) + '}';
    }

    // Функція реалізує точки входу ззовні об'єкта класу
    command(cmd) {
        const xT = timers['idTimePKUpdateTimer'];
        let value;
        switch (cmd) {
            case 'startTimer':
                if (([undefined, null].indexOf(xT) >= 0) && (this.update_interval  !== null)) {
                    timers['idTimePKUpdateTimer'] = setInterval(recallTimerMethod, this.update_interval, this.objectid, 'updateDateTime');
                    console.log('Годинник запущений');
                }
                break;
            case 'stopTimer':
                if (xT !== null) {
                    clearInterval(timers['idTimePKUpdateTimer']);
                    console.log('Годинник зупинений');
                    timers['idTimePKUpdateTimer'] = null;
                }
                break;
            case 'copyTimeDev':
                value = this.getDeviceDateAsValues();
                if (value.length > 5) this.outValues(value);
                else
                    console.log('Дата пристрою не доступна');
                break;
            case 'copyTimePK':
                value = this.getValuesFromDate(new Date());
                this.outValues(value);
                break;
        }
    }

    // Функція вертає час пристрою у вигляді масиву значень
    getDeviceDateAsValues() {
        let value = htmlObjects[this.devime].getValue();
        value = replace(value,'.',' ');
        value = replace(value,':',' ');
        return value.split(' ');
    }

    // Зберігає значення
    save () {
        const change = this.changed();
        if (change) {
            let value = this.getValue();
            value = this.exportDate(value);
            if (htmlObjects[this.forallid].obj.checked)
                alert('Встановлюється час тільки для пристрою ' + devID);
            requestSaveValue(this, value);
        }
        return change ? 1 : 0;
    }

    changed() {
        let oldval = this.getDeviceDateAsValues();
        oldval = this.getDateFromValues(oldval).valueOf();
        let newval = this.getValue();
        if (newval === null) return false;
        newval = newval.valueOf();
        const chg = Math.abs((newval - oldval)/1000);
        console.log('Deviation = '+chg);
        return (chg > 5);
        // return false;
    }

    reinit() {
        // Реініт тут не потрібний, так як самої властивості orig немає, бо значення динамічне по суті
        // Залишений тільки для сумісності
    }
}   // Кінець класу DateTimePK
