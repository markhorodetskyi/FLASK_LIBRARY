'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                Клас опису об'єкту двох текстбоксів для вводу дати та часу (Для журналу навантажень)
 ----------------------------------------------------------------------------------------------------------------------
 key             - Ключ Modbus, що надсилається у запиті до пристрою та дані з якого необхідно вивести на сторінку.
 date_id - id текстового поля вводу (елементу input типу text) на html сторінці для вводу дати
 time_id - id текстового поля вводу (елементу input типу text) на html сторінці для вводу часу
----------------------------------------------------------------------------------------------------------------------*/
class DateTimeAs2Edit  {
    constructor (key, date_id, time_id ) {
        this.key = key;
        this.obj_date = getElementEx('Конструктор DateTime', date_id);
        this.obj_time = getElementEx('Конструктор DateTime', time_id);
        this.objectid = date_id + time_id;
        this.orig = null;
        this.last = null;
        requestOriginValue(this);
    }

    copyNow() {
        const x = new Date();
        const sdate = twoSym(x.getDate()) + '.' + twoSym(x.getMonth()+1) + '.' + twoSym(x.getFullYear());
        const stime = twoSym(x.getHours()) + ':' + twoSym(x.getMinutes()) + ':' + twoSym(x.getSeconds());
        this.obj_date.value = sdate;
        this.obj_time.value = stime;
        // this.orig = sdate + ' ' + stime;
    }

    // Функція перевіряє коректність дати в форматі d.m.yyy та вертає її в форматі dd.mm.yyyy або false
    checkDate(sdate) {
       sdate = sdate.split('.');
       for (let i in sdate) sdate[i] = twoSym(sdate[i]);
       let bok = (sdate.length === 3);
       if (bok) {
          let res = [];
          res.push(checkNumber(sdate[0], 1, 31));
          res.push(checkNumber(sdate[1], 1, 12));
          res.push(checkNumber(sdate[2], 0, 9999));
          bok = (res.indexOf(false) < 0);
       }
       if (bok) {
          const xdate = new Date(sdate[2], Number(sdate[1])-1, sdate[0]);   // Якщо день не коректний, об'єкт дати змінить і день і місяць
          const result = twoSym(xdate.getDate()) + '.' + twoSym(xdate.getMonth()+1) + '.' + xdate.getFullYear();
          sdate = sdate.join('.');
          bok = (sdate === result);
          if (bok) bok = result;
       }
       return bok;
    }

    // Функція перевіряє коректність часу в форматі h:m:s та вертає його в форматі hh:mm:ss або false
    checkTime(stime) {
       stime = stime.split(':');
       for (let i in stime) stime[i] = twoSym(stime[i]);
       if (stime.length === 3) {
          let res = [];
          res.push(checkNumber(stime[0], 0, 24));
          res.push(checkNumber(stime[1], 0, 59));
          res.push(checkNumber(stime[2], 0, 59));
          if (res.indexOf(false) < 0) return stime.join(':');
       }
       return false;
    }

    getPart(value, part) {
        if (value === null) {
            return null;
        }
        else {
            value = value.split(' ');
            if (value.length === 2) return value[part];
            return null;
        }
    }


    change() {            // Викликається тільки на onblur
        let sdate = this.checkDate(this.obj_date.value);
        if (sdate) {
            if (sdate !== this.obj_date.value) this.obj_date.value = sdate;
            // if (sdate !== this.last) this.last = sdate;
        }
        else {                                                  // Дата хєрова - треба повернути попереднє
            if (this.last === null) {                               // Якщо дата-час не мінялися
                if (this.orig === null)                                 // Якщо дата-час не зчитані
                    this.obj_date.value = '';                               // Видаляємо значення
                else                                                    // Якщо дата зчитана
                    this.obj_date.value = this.getPart(this.orig, 0);   // Вертаємо зчитану дату
            }
            else {                                                  // Якщо дата-час змінювалися
                this.obj_date.value = this.getPart(this.last, 0);   // Вертаємо останню коректну дату
            }
        }
        //-------------------
        let stime = this.checkTime(this.obj_time.value);
        if (stime) {
            if (stime !== this.obj_time.value) this.obj_time.value = stime;
        }
        else {                                                      // Час хєровий - треба повернути попереднє
            if (this.last === null) {                                   // Якщо дата-час не змінений
                if (this.orig === null)                                     // Якщо дата-час не зчитані
                    this.obj_time.value = '';                                   // Видаляємо час
                else                                                        // Якщо дата-час зчитані
                    this.obj_time.value = this.getPart(this.orig, 1);     // Вертаємо зчитаний час
            }
            else {                                                      // Якщо дата-час мінялися
                this.obj_time.value = this.getPart(this.last, 1);       // Вертаємо останній коректний час
            }
        }
        //-------------------
        if (sdate && stime) this.last = sdate +' ' + stime;     // Якщо дата і час коректні - зберігаємо їх як останні коректні
    }

    initValue(value) {
        value = value.split(' ');
        if (value.length > 1) {
            const sdate = this.checkDate(value[0]);
            if (sdate) {
                this.obj_date.value = sdate;
                console.log('Ініціалізація елементу ' + this.obj_date.id + ' значенням [' + sdate + ']');
            }
            else {
                console.log('Значення  ' + value[0] + ' не коректне. Елемент ' + this.obj_date.id + ' не ініціалізується');
            }
            //--------------
            const stime = this.checkTime(value[1]);
            if (stime) {
                this.obj_time.value = stime;
                console.log('Ініціалізація елементу ' + this.obj_time.id + ' значенням [' + stime + ']');
            }
            else {
                console.log('Значення  ' + value[1] + ' не коректне. Елемент ' + this.obj_time.id + ' не ініціалізується');
            }
            //--------------
            if (sdate && stime)
                this.orig = sdate + ' ' + stime;
            else
                console.log('Значення  ' + value.join(' ') + ' не коректне. Елемент ' + this.objectid + ' не ініціалізується');
        }
        else {
            console.log('Значення  ' + value.join(' ') + ' не коректне. Елементи ' + this.obj_date.id + ' та ' +
                this.obj_time.id + ' не ініціалізуються' );
        }
    }

    reinit() {
        this.last = null;
        this.orig = this.obj_date.value + ' ' + this.obj_time.value;
    }

    save() {
        const change = this.changed();
        if (change) {
            const nv = ('{' + this.obj_date.value + ' ' + this.obj_time.value + '}');
            requestSaveValue(this, nv);
        }
        return change ? 1 : 0;
    }

    changed() {
        let change = false;

        if (this.orig === null) {                                           // Не ініціалізовані
            change = (this.obj_date.value !== '') && (this.obj_time !== '');    // Будь - яке значення
        }
        else {                                                              // Ініціалізовані
            const nv = (this.obj_date.value + ' ' + this.obj_time);
            change = (nv !== this.orig);                                        // Тільки якщо змінені
        }
        return change;
    }
} // Кінець класу DateTime
