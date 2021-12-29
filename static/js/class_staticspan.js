'use strict';
/*----------------------------------------------------------------------------------------------------------------------
          Клас описує текстовий елемент, значення в який вчитується знаходиться на сторінці у вигляді контексту
 ----------------------------------------------------------------------------------------------------------------------
 key             - Ключ Modbus, що надсилається у запиті до пристрою, дані з якого необхідно вивести на сторінку.
                   Якщо ключ не вказаний - об'єкт ініціалізується на підставі даних з свого чи іншого об'єкту за допомогою відповідної механіки
 obj_id          - id текстового тегу (span, label) на html сторінці
 translate_dict  - Словник, згідно якого зчитані значення будуть перекладены перед виводом на html сторінку. Ключами
                   словника вказуються значення, що можуть бути зчитані з пристрою. При відсутності словника, або відповідного
                   ключа - зчитане значення виводиться як є
    --- Параметри створені для форм з датою / часом ---
 init_interval   - Інтервал часу в мілісекундах, через який буде постійно буде перечитуватися дані з пристрою, відповідно ключу та словнику
 create_mechanic - Назва алгоритму механіки, яка виконується при створенні об'єкту або при спрацюванні таймеру init_interval. (Підчитка годинника раз в 11 секунд)
 update_interval - Інтервал часу в мілісекундах, через який буде постійно буде оновлюватися значення елементу за алгоритмом, сказаним в параметрі update_mechanic
 update_mechanic - Назва алгоритму механіки, яка виконується при спрацюванні таймеру update_interval. (Хід годинника пристрою та ПК на сторінці)
    --- Параметр створений для форми телеуправління ---
 ext_mechanic    - назва алгоритму, який має виконатися після ініціалізації об'єкту (отримання значення)
 ----------------------------------------------------------------------------------------------------------------------*/
class StaticSpan {
    constructor (key, obj_id, translate_dict, init_interval=null, create_mechanic=null, update_interval=null, update_mechanic=null, ext_mechanic=null) {
        // const me = 'Конструктор StaticSpan: ';
        this.key = key;
        this.objectid = obj_id;
        this.obj = getElementEx('Конструктор StaticSpan: ', obj_id);
        this.orig = null;
        this.create_mechanic = create_mechanic;
        this.update_mechanic = update_mechanic;
        this.translate_dict = translate_dict;
        this.ext_mechanic = ext_mechanic;

        //---- Інтервал отримання первинного значення ----------
        this.mechanic_val(this.create_mechanic);                // Надсилаємо запит / Формуємо значння згідно механіки
        if (init_interval !== null) {
            timers['idTimeInitTimer'] = setInterval(recallTimerMethod, init_interval, this.objectid, create_mechanic );    // Встановлюємо таймер, що буде посилати запити / Формувати значення
        }
        //------ Інтервал проміжного значення --------
        if (update_interval !== null) {
            timers['idTimeUpdateTimer'] = setInterval(recallTimerMethod, update_interval, this.objectid, update_mechanic);
        }
    }

    mechanic_val(mechanic) {
        // Перетворює масив значень в строку, в якому кожне значення починається з нового рядку
        function convertListKLToString(value) {
            if (value.length === 0)
                return '';
            else if (value.length === 1)
                return value[0];
            else
                return value.join('\n');
        }

        let value;
        if (mechanic === null) mechanic = 'requestOrig';
        switch (mechanic) {
            // Механіка для всіх форм
            case 'requestOrig':                                     // Запит значення
                requestOriginValue(this);
                break;
            // Механіки для форми налаштування часу
            case 'initDateTimePK':                                  // Формування дати та часу ПК
                const now = new Date();
                value=twoSym(now.getDate()) + '.' + twoSym(now.getMonth()+1) + '.' + now.getFullYear() +
                    ' ' + twoSym(now.getHours()) + ':' + twoSym(now.getMinutes()) + ':' + twoSym(now.getSeconds());
                this.initValue(value);
                break;

            case 'updateDateTime':
                const origVal = this.getValue();
                value=replace(origVal ,'.', ' ');
                value=replace(value,':', ' ');
                value = value.split(' ');
                // 13.03.2020 11:05:55 370
                let bok = (value.length > 5);

                if (bok) bok = checkNumber(value[0],1,31) && checkNumber(value[1],1,12) &&
                        checkNumber(value[2],2000,2099) && checkNumber(value[3],0,23) &&
                        checkNumber(value[4],0,59) && checkNumber(value[5],0,59);
                if (bok) {
                    let dt = new Date(value[2], Number(value[1])-1, value[0], value[3], value[4], Number(value[5])+1);
                    let newDT = twoSym(dt.getDate()) + '.' + twoSym(dt.getMonth()+1) + '.' + dt.getFullYear() + ' ' +
                        twoSym(dt.getHours()) + ':' + twoSym(dt.getMinutes()) + ':' + twoSym(dt.getSeconds());
                    if (value.length > 6) newDT = newDT + ' ' + value[6];
                    this.initValue(newDT, false);
                }
                else {
                    console.log('Значення дати-часу [' + origVal + '] не коректне та не може бути оновлене');
                }
                break;
            // Механіки для форми телеуправління
            case 'enableKL1btn':
                htmlObjects['btnSwitchKL1'].obj.disabled = (this.orig === '0');
                break;

            case 'enableKL2btn':
                htmlObjects['btnSwitchKL2'].obj.disabled = (this.orig === '0');
                break;

            case 'enableKL3btn':
                htmlObjects['btnSwitchKL3'].obj.disabled = (this.orig === '0');
                break;

            case 'enableKL4btn':
                htmlObjects['btnSwitchKL4'].obj.disabled = (this.orig === '0');
                break;

            case 'enableDSHbtn':
                htmlObjects['btnSwitchKLD'].obj.disabled = (this.orig === '0');
                break;

            case 'spnInfoBKV':
                // в this.orig лежить p0-i4
                if (checkDInumber(this.orig)) {
                    if (this.orig[1] === '0')
                        value = 'не призначений';
                    else
                        value = 'призначений на вхід DI-' + this.orig[1] + ', (' + ((this.orig[0] === 'i') ? ('інверсний') : ('прямий')) + ' сигнал)';
                }
                else {
                    value = 'не відомий'
                }
                this.initValue(value, false, false);
                break;

            case 'spnValueVV':
                // в this.orig лежить 0101
                // в htmlObjects['spnInfoBKV'].orig лежить p0-p4/ i1-i4
                const bkv = htmlObjects['spnInfoBKV'].orig;
                value = getVVvalue(bkv, this.orig);
                if (value !== '') {
                    if (value === '0')
                        value = 'вимкнений';
                    else if (value === '1')
                        value = 'увімкнений';
                    else
                        value = 'не визначений';
                    this.initValue(value, false, false);
                }
                break;

            case 'spnStatusKL4':
                if (this.orig.length > 1) {                     // Необхідні дві ініціалізації щоб взяти тільки положення КЛ-4
                    value = this.orig.split('').reverse()[3];
                    this.initValue(value);
                }
             // Для об'єкту Стану КЛ-4(На формі ТУ ): Зміна назви кнопки телеуправління КЛ-4
                if (['0','1'].indexOf(value) >=0)                       // В нормальному режимі
                    htmlObjects['btnSwitchKL4'].obj.value = ((value === '0')?'Замкнути реле':'Розімкнути реле');
                else                                                        //В режимі оновлення сторінки
                    htmlObjects['btnSwitchKL4'].obj.value = '----------';
                break;

            case 'spnListReleOn':
                {
                const allow_tu = [htmlObjects['spnAllowTU_KL1'].orig, htmlObjects['spnAllowTU_KL2'].orig, htmlObjects['spnAllowTU_KL3'].orig];
                const names_kl = [htmlObjects['spnNameKL1'].orig, htmlObjects['spnNameKL2'].orig, htmlObjects['spnNameKL3'].orig]
                const logic_kl = [htmlObjects['spnLogicKL1'].orig, htmlObjects['spnLogicKL2'].orig, htmlObjects['spnLogicKL3'].orig]
                value = [];
                for (let i = 0; i < 3; i++) {
                    if ((allow_tu[i] === '1') && (logic_kl[i] === '1'))
                        value.push('KL-' + (i + 1) + ' (' + names_kl[i] + ')');
                }
                const vvstatus = getVVvalue(htmlObjects['spnInfoBKV'].orig, htmlObjects['spnValueVV'].orig);
                // Кнопка "Включити вимикач" не активна якщо стан вимикача відомий та включений або немає реле для включення
                htmlObjects['btnVVon'].obj.disabled = ((vvstatus === '1') || (value.length === 0))
                }
                this.initValue(convertListKLToString(value), false, false);
                break;

            case 'spnListReleOff':
                {
                const allow_tu = [htmlObjects['spnAllowTU_KL1'].orig, htmlObjects['spnAllowTU_KL2'].orig, htmlObjects['spnAllowTU_KL3'].orig];
                const names_kl = [htmlObjects['spnNameKL1'].orig, htmlObjects['spnNameKL2'].orig, htmlObjects['spnNameKL3'].orig]
                const logic_kl = [htmlObjects['spnLogicKL1'].orig, htmlObjects['spnLogicKL2'].orig, htmlObjects['spnLogicKL3'].orig]
                value = [];
                for (let i = 0; i < 3; i++) {
                    if ((allow_tu[i] === '1') && (logic_kl[i] === '0'))
                        value.push('KL-' + (i + 1) + ' (' + names_kl[i] + ')');
                }
                const vvstatus = getVVvalue(htmlObjects['spnInfoBKV'].orig, htmlObjects['spnValueVV'].orig);
                // Кнопка "Відключити вимикач" не активна якщо стан вимикача відомий та відключений або немає реле для відключення
                htmlObjects['btnVVoff'].obj.disabled = ((vvstatus === '0') || (value.length === 0))
                }
                if (htmlObjects['spnAllowTU_DSH'].orig === '1') value.push('DSH (Дешунтування)');
                this.initValue(convertListKLToString(value), false, false);
                break;

            case 'spnDI_ZZ':
                if (checkAnswerWithDI(this.orig,false))
                    if (this.orig[1] === '0') {
                        this.initValue('---', false, false);
                        htmlObjects['chkbxUseZZ'].obj.checked = false;
                    }
                else {
                    this.initValue('DI-' + this.orig[1], false, false);
                    }
                break;

            case 'spnDI_ACHR':
                if (checkAnswerWithDI(this.orig,false))
                    if (this.orig[1] === '0') {
                        this.initValue('---', false, false);
                        htmlObjects['chkbxUseACHR'].obj.checked = false;
                    }
                else {
                    this.initValue('DI-' + this.orig[1], false, false);
                    }
                break;

            default:
                console.log('Механіка [' + mechanic + '] не передбачена класом StaticSpan');
        }
    }

    getValue() {
        return this.obj.innerText;
    }

    // Встановлює значення orig зчитаним значенням та / або виводить значення на html сторінку після чого може виконати механіку
    initValue(value, init=true, exec_extmechanic = true) {
        if (init) this.orig = value;
        if (value in this.translate_dict) {
            value = this.translate_dict[this.orig];
        }
        console.log((init ? 'Ініціалізація' : 'Оновлення') + ' елементу ' + this.obj.id + ' значенням [' + value + ']');
        this.obj.innerText = value;
        if  ((this.ext_mechanic !== null) && exec_extmechanic) this.mechanic_val(this.ext_mechanic);
    }

    save () { // Існує тільки для уніфікації обробки об'єктів і циклі
        return 0;
    }

    changed() { // Існує тільки для уніфікації обробки об'єктів і циклі
        return false;
    }
}
