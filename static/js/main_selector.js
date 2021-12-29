/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування захистів МСЗ-1 та МСЗ-2
* --------------------------------------------------------------------------------------------------------------------*/
function settingsMSZprepate(shieldNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів МСЗ-' + shieldNum);
    // -----------------------
    const sName = 'MSZ' + shieldNum;
    const src = ['Пуск МСЗ-' + shieldNum , 'Робота МСЗ-' + shieldNum];
    let name, sources;

    htmlObjects['edtIwork'] = new NumEdit(sName + '_Iwork', 'edtIwork', 0.3, 150, 0.01);
    htmlObjects['edtWaitTime'] = new NumEdit(sName + '_Twork', 'edtWaitTime', 0, 300, 0.01);
    htmlObjects['edtBackK'] = new NumEdit(sName + '_ReturnKoef', 'edtBackK', 0.4, 0.95, 0.01);
    htmlObjects['cbxFeature'] = new ComboFeatures(sName + '_Feature','cbxFeature');
    htmlObjects['edtAccelerate'] = new NumEdit(sName + '_TimeAcceleration', 'edtAccelerate', 0, 1, 0.01);

    const group = ['lblAcceleration', 'btnAccelerationDown', 'edtAccelerate', 'btnAccelerationUp'];
    htmlObjects['chkbxUseAcceleration'] =new UseCheckbox(sName + '_UseAcceleration', 'chkbxUseAcceleration', group);

    htmlObjects['cbxDI']  = new ComboDI(sName +'_LockedByDI', 'cbxDI', 'chkbxUseBlockedByDI','chkbxInverseBlockedByDI');

    for (let i = 1; i < 4; i++) {
        name = 'chkbxOnStartKL' + i + 'chkbxOnWorkKL'+i;
        sources = BuildDictForSource(['chkbxOnStartKL', 'chkbxOnWorkKL'], src, i);
        htmlObjects[name] = new MultiCheckbox('KL' + i + '_SourceOnShields', name, sources, 'BIT018');
    }
    htmlObjects['chkbxOnWorkKL4'] = new BitSingleCheckbox('KL4_SourceOnShields','chkbxOnWorkKL4', src[1],'BIT18A');
    htmlObjects['chkbxOnWorkDSH'] = new BitSingleCheckbox('KLD_SourceOnShields','chkbxOnWorkDSH', src[1],'BIT18A');

    for (let i = 1; i <8; i++) {
        name = 'chkbxOnStartVD' + i + 'chkbxOnWorkVD'+i;
        sources = BuildDictForSource(['chkbxOnStartVD', 'chkbxOnWorkVD'], src, i);
        htmlObjects[name] = new MultiCheckbox('VD' + i + '_SourceOnShields', name, sources ,'BIT024');
    }
    name = 'chkbxOnStartOscilchkbxOnWorkOscil';
    sources = BuildDictForSource(['chkbxOnStartOscil', 'chkbxOnWorkOscil'], src, '');
    htmlObjects[name] = new MultiCheckbox('Oscil_SourceOnShields', name, sources, 'BIT017');
    htmlObjects['chkbxResourseVV'] = new BitSingleCheckbox('VV_ResourceOnShields','chkbxResourseVV', src[1],'BIT029');
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування захистів СВ-1 та СВ-2
* --------------------------------------------------------------------------------------------------------------------*/
function settingsSVprepate(shieldNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів СВ-' + shieldNum);
    // -----------------------
    const sName = 'SV' + shieldNum;
    const src = ['Пуск СВ-' + shieldNum , 'Робота СВ-' + shieldNum];

    htmlObjects['edtIwork'] = new NumEdit(sName + '_Iwork', 'edtIwork', 0.3, 150, 0.01);
    htmlObjects['edtWaitTime'] = new NumEdit(sName + '_Twork', 'edtWaitTime', 0, 32, 0.01);
    htmlObjects['edtBackK'] = new NumEdit(sName + '_ReturnKoef', 'edtBackK', 0.4, 0.95, 0.01);
    htmlObjects['cbxDI']  = new ComboDI(sName +'_LockedByDI', 'cbxDI', 'chkbxUseBlockedByDI','chkbxInverseBlockedByDI');

    for (let i = 1; i < 4; i++) {
        htmlObjects['chkbxOnWorkKL'+i] = new BitSingleCheckbox('KL' + i + '_SourceOnShields', 'chkbxOnWorkKL'+i, src[1], 'BIT018');
    }

    htmlObjects['chkbxOnWorkKL4'] = new BitSingleCheckbox('KL4_SourceOnShields','chkbxOnWorkKL4', src[1],'BIT18A');
    htmlObjects['chkbxOnWorkDSH'] = new BitSingleCheckbox('KLD_SourceOnShields','chkbxOnWorkDSH', src[1],'BIT18A');

    for (let i = 1; i <8; i++) {
        htmlObjects['chkbxOnWorkVD'+i] = new BitSingleCheckbox('VD' + i + '_SourceOnShields','chkbxOnWorkVD'+i,src[1], 'BIT024');
    }
    const name = 'chkbxOnStartOscilchkbxOnWorkOscil';
    const sources = BuildDictForSource(['chkbxOnStartOscil', 'chkbxOnWorkOscil'], src, '');
    htmlObjects[name] = new MultiCheckbox('Oscil_SourceOnShields', name, sources, 'BIT017');
    htmlObjects['chkbxResourseVV'] = new BitSingleCheckbox('VV_ResourceOnShields','chkbxResourseVV','Робота МСЗ-' + shieldNum,'BIT029');
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування захистів ЗНЗ-1 та ЗНЗ-2
* --------------------------------------------------------------------------------------------------------------------*/
function settingsZNZprepate(shieldNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів ЗНЗ-' + shieldNum);
    // -----------------------
    const sName = 'ZNZ' + shieldNum;
    const src = ['Пуск ЗНЗ-' + shieldNum , 'Робота ЗНЗ-' + shieldNum];

    // -------------
    let group = ['lblLaunch3I0', 'btnLaunch3I0Down', 'edtIwork', 'btnLaunch3I0Up'];
    htmlObjects['chkbxUseLaunch3I0'] =new UseCheckbox(sName + '_UseLaunchOn3I0', 'chkbxUseLaunch3I0', group);
    // !!! Треба попередньо дізнатися межі
    htmlObjects['edtIwork'] = new NumEdit(sName + '_Iwork', 'edtIwork', 0.004, 5.0, 0.001);
    // -------------
    group = ['lblLaunch3U0', 'btnLaunch3U0Down', 'edtUwork', 'btnLaunch3U0Up'];
    htmlObjects['chkbxUseLaunch3U0'] =new UseCheckbox(sName + '_UseLaunchOn3U0', 'chkbxUseLaunch3U0', group);
    htmlObjects['edtUwork'] = new NumEdit(sName + '_Uwork', 'edtUwork', 2, 100, 1);
    // -------------
    htmlObjects['edtWaitTime'] = new NumEdit(sName + '_Twork', 'edtWaitTime', 0, 300, 0.01);
    // -------------
    group = ['lblMaxSenseAngle', 'btnMaxSenseAngleDown', 'edtMaxSenseAngle', 'btnMaxSenseAngleUp',
        'lblZoneWidthByAngle','btnZoneWidthByAngleDown','edtZoneWidthByAngle','btnZoneWidthByAngleUp'];
    htmlObjects['chkbxUseDirection'] =new UseCheckbox(sName + '_UseDirection', 'chkbxUseDirection', group);
    htmlObjects['edtMaxSenseAngle'] = new NumEdit(sName + '_AngleMaxSence', 'edtMaxSenseAngle', 0, 359, 1);
    htmlObjects['edtZoneWidthByAngle'] = new NumEdit(sName + '_ZoneWidthByAngle', 'edtZoneWidthByAngle', 10, 180, 1);
    // -------------
    htmlObjects['cbxDI']  = new ComboDI(sName +'_LockedByDI', 'cbxDI', 'chkbxUseBlockedByDI', 'chkbxInverseBlockedByDI');
    // -------------
    for (let i = 1; i < 4; i++) {
        htmlObjects['chkbxOnWorkKL'+i] = new BitSingleCheckbox('KL' + i + '_SourceOnShields','chkbxOnWorkKL'+i, src[1], 'BIT018');
    }

    htmlObjects['chkbxOnWorkKL4'] = new BitSingleCheckbox('KL4_SourceOnShields','chkbxOnWorkKL4', src[1],'BIT18A');
    htmlObjects['chkbxOnWorkDSH'] = new BitSingleCheckbox('KLD_SourceOnShields','chkbxOnWorkDSH', src[1],'BIT18A');

    for (let i = 1; i <8; i++) {
        htmlObjects['chkbxOnWorkVD'+i] = new BitSingleCheckbox('VD' + i + '_SourceOnShields', 'chkbxOnWorkVD'+i, src[1], 'BIT024');
    }
    const name = 'chkbxOnStartOscilchkbxOnWorkOscil';
    const sources = BuildDictForSource(['chkbxOnStartOscil', 'chkbxOnWorkOscil'], src, '');
    htmlObjects[name] = new MultiCheckbox('Oscil_SourceOnShields', name, sources, 'BIT017');
    htmlObjects['chkbxResourseVV'] = new BitSingleCheckbox('VV_ResourceOnShields','chkbxResourseVV', src[1],'BIT029');
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування захисту АЧР
* --------------------------------------------------------------------------------------------------------------------*/
function settingsACHRprepate(sName) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів АЧР');
    // -----------------------
    const src = 'Робота АЧР';
    htmlObjects['cbxDI']  = new ComboDI(sName +'_SourceDI', 'cbxDI', '', '');
    for (let i = 1; i < 4; i++)
        htmlObjects['chkbxOnWorkKL'+i] = new BitSingleCheckbox('KL' + i + '_SourceOnShields','chkbxOnWorkKL'+i, src, 'BIT018');

    htmlObjects['chkbxOnWorkKL4'] = new BitSingleCheckbox('KL4_SourceOnShields','chkbxOnWorkKL4', src,'BIT18A');
    htmlObjects['chkbxOnWorkDSH'] = new BitSingleCheckbox('KLD_SourceOnShields','chkbxOnWorkDSH', src,'BIT18A');
    for (let i = 1; i <8; i++) {
        htmlObjects['chkbxOnWorkVD'+i] = new BitSingleCheckbox('VD' + i + '_SourceOnShields',
            'chkbxOnWorkVD'+i, src, 'BIT024');
    }
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування захисту ЗЗ
* --------------------------------------------------------------------------------------------------------------------*/
function settingsZZprepate(sName) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів ЗЗ');
    // -----------------------
    const src = 'Робота ЗЗ';
    htmlObjects['cbxDI']  = new ComboDI(sName +'_SourceDI', 'cbxDI', '', '');
    htmlObjects['edtWaitTime'] = new NumEdit(sName + '_Twork', 'edtWaitTime', 0, 300, 0.01);
    for (let i = 1; i < 4; i++)
        htmlObjects['chkbxOnWorkKL'+i] = new BitSingleCheckbox('KL' + i + '_SourceOnShields','chkbxOnWorkKL'+i, src, 'BIT018');

    htmlObjects['chkbxOnWorkKL4'] = new BitSingleCheckbox('KL4_SourceOnShields','chkbxOnWorkKL4', src,'BIT18A');
    htmlObjects['chkbxOnWorkDSH'] = new BitSingleCheckbox('KLD_SourceOnShields','chkbxOnWorkDSH', src,'BIT18A');
    for (let i = 1; i <8; i++) {
        htmlObjects['chkbxOnWorkVD'+i] = new BitSingleCheckbox('VD' + i + '_SourceOnShields',
            'chkbxOnWorkVD'+i, src, 'BIT024');
    }

    htmlObjects['chkbxOnWorkOscil'] = new BitSingleCheckbox('Oscil_SourceOnShields', 'chkbxOnWorkOscil', src, 'BIT017');
    htmlObjects['chkbxResourseVV'] = new BitSingleCheckbox('VV_ResourceOnShields','chkbxResourseVV', src,'BIT029');
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування АПВ
* --------------------------------------------------------------------------------------------------------------------*/
function settingsAPVprepate(sName) {
    outHeadToConsole('Підготовка елементів сторінки налаштування параметрів АПВ');
    // -----------------------
    const src = ['Готовність АПВ', 'Робота АПВ'];
    let name, sources;
    htmlObjects['apvMode']  = new RadioGroup(sName + '_UseMode', 'apvMode', 'MechanicApvMode');
    htmlObjects['cbxBKV_DI']  = new ComboDI(sName +'_SourceDIonBKV', 'cbxBKV_DI', '', 'chkbxInverseBKVDI');
    htmlObjects['edtReadyTime'] = new NumEdit(sName + '_ReadyTime', 'edtReadyTime', 1, 120, 0.1);
    htmlObjects['edtTimeWait1'] = new NumEdit(sName + '_Pass1Twork', 'edtTimeWait1', 1, 25, 0.1);
    htmlObjects['edtTimeWait2'] = new NumEdit(sName + '_Pass2Twork', 'edtTimeWait2', 1, 600, 0.1);
    //-----------
    htmlObjects['chkbxAPVafterMSZ1'] = new UseCheckbox('MSZ1_UseAPV', 'chkbxAPVafterMSZ1');
    htmlObjects['chkbxAPVafterMSZ2'] = new UseCheckbox('MSZ2_UseAPV', 'chkbxAPVafterMSZ2');
    htmlObjects['chkbxAPVafterSV1'] = new UseCheckbox('SV1_UseAPV', 'chkbxAPVafterSV1');
    htmlObjects['chkbxAPVafterSV2'] = new UseCheckbox('SV2_UseAPV', 'chkbxAPVafterSV2');
    htmlObjects['chkbxAPVafterZNZ1'] = new UseCheckbox('ZNZ1_UseAPV', 'chkbxAPVafterZNZ1');
    htmlObjects['chkbxAPVafterZNZ2'] = new UseCheckbox('ZNZ2_UseAPV', 'chkbxAPVafterZNZ2');
    htmlObjects['chkbxAPVafterZZ'] = new UseCheckbox('ZZ_UseAPV', 'chkbxAPVafterZZ');
    htmlObjects['chkbxAPVafterACHR'] = new UseCheckbox('APV_UseCHAPV', 'chkbxAPVafterACHR');
    //-----------
    htmlObjects['cbxLaunchByDI']  = new ComboDI(sName +'_LaunchByDI', 'cbxLaunchByDI', 'chkbxUseLaunchByDI', '');
    //-----------
    htmlObjects['cbxBlockedDI']  = new ComboDI(sName +'_LockedByDI', 'cbxBlockedDI', 'chkbxUseBlockedByDI', 'chkbxInverseBlockedByDI');
    //-----------
    htmlObjects['chkbxOnWorkKL1'] = new BitSingleCheckbox('KL1_SourceOnShields','chkbxOnWorkKL1', src[1], 'BIT018');
    htmlObjects['chkbxOnWorkKL2'] = new BitSingleCheckbox('KL2_SourceOnShields','chkbxOnWorkKL2', src[1], 'BIT018');
    htmlObjects['chkbxOnWorkKL3'] = new BitSingleCheckbox('KL3_SourceOnShields','chkbxOnWorkKL3', src[1], 'BIT018');
    const logic = {'0': 'На відключення', '1': 'На включення'};
    htmlObjects['LogicKL1'] = new StaticSpan('KL1_LogicOnOff','LogicKL1', logic);
    htmlObjects['LogicKL2'] = new StaticSpan('KL2_LogicOnOff','LogicKL2', logic);
    htmlObjects['LogicKL3'] = new StaticSpan('KL3_LogicOnOff','LogicKL3', logic);
    //-----------
    for (let i = 1; i <8; i++) {
        name = 'chkbxOnReadyVD' + i + 'chkbxOnWorkVD' + i;
        sources = BuildDictForSource(['chkbxOnReadyVD','chkbxOnWorkVD'],src,i);
        htmlObjects[name] = new MultiCheckbox('VD' + i + '_SourceOnShields', name, sources, 'BIT024');
    }
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінках налаштування всіх вихідних реле
* --------------------------------------------------------------------------------------------------------------------*/
function settingsKLprepate(klNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування вихідного реле KL-' + klNum);
    // -----------------------
    let bfor_kl123 = false, buse_tu = false, bfor_kl4 = false, bfor_dsh = false;
    let format = '', sources;

    if (isNaN(klNum)) {                 // Дешунтування
        bfor_dsh = true;
        buse_tu = true;
        format = 'BIT18A';
        klNum = 'D';
    }
    else {
        if (['1', '2', '3'].indexOf(klNum) >= 0) {
            bfor_kl123 = true;
            buse_tu = true;
            format = 'BIT018';
        }
        else if (klNum === '4') {
            bfor_kl4 = true;
            buse_tu = true;
            format = 'BIT18A';
        }
        else if (klNum !== '5') {
            console.log('Shit, maza faka');
        }
    }
    const name_dict = {'1': 'Реле KL-1', '2': 'Реле KL-2', '3': 'Реле KL-3', '4': 'Реле KL-4',
        '5': 'Реле KL-5 (Стан пристрою)', 'D': 'Семістори дешунтування ВВ'};
    document.title = name_dict[klNum];

    const group = ['lblNameKL', 'edtNameKL', 'lblInfoNameKL'];
    htmlObjects['edtNameKL'] = new NameEdit('KL' + klNum +'_Name','edtNameKL', bfor_dsh,'lblInfoNameKL', group);
    if (bfor_kl123) {
        htmlObjects['LogicKL']  = new RadioGroup('KL' + klNum + '_LogicOnOff', 'LogicKL', 'MechanicKL123LogicMode');
        //----------------
        htmlObjects['ModeKL']  = new RadioGroup('KL' + klNum + '_Mode', 'ModeKL', 'MechanicKL123LogicMode');
        //----------------
        htmlObjects['edtTimeOn'] = new NumEdit('KL' + klNum + '_TimeOn','edtTimeOn',0.05, 0.5,0.01);
        htmlObjects['edtTimeOffDelay'] = new NumEdit('KL' + klNum + '_TimeOffDelay','edtTimeOffDelay',0, 0.5, 0.01);
    }
    if (buse_tu) {
        htmlObjects['chkbxUseTelecontrol'] = new UseCheckbox('KL' + klNum + '_TeleControlAllow', 'chkbxUseTelecontrol');
    }
    if (format !== '') {
        if (format === 'BIT018')
            sources = {'chkbxOnLaunchMSZ1':'Пуск МСЗ-1', 'chkbxOnWorkMSZ1':'Робота МСЗ-1', 'chkbxOnWorkSV1':'Робота СВ-1',
                'chkbxOnWorkZNZ1':'Робота ЗНЗ-1', 'chkbxOnWorkZZ':'Робота ЗЗ', 'chkbxOnWorkAPV':'Робота АПВ',
                'chkbxOnLaunchMSZ2':'Пуск МСЗ-2','chkbxOnWorkMSZ2':'Робота МСЗ-2', 'chkbxOnWorkSV2':'Робота СВ-2',
                'chkbxOnWorkZNZ2':'Робота ЗНЗ-2', 'chkbxOnWorkACHR':'Робота АЧР', 'chkbxOnResourceVV':'Ресурс ВВ закінчується'};
        else
            sources = {'chkbxOnWorkMSZ1':'Робота МСЗ-1', 'chkbxOnWorkSV1':'Робота СВ-1', 'chkbxOnWorkZNZ1':'Робота ЗНЗ-1',
                'chkbxOnWorkZZ':'Робота ЗЗ', 'chkbxOnWorkACHR':'Робота АЧР','chkbxOnWorkMSZ2':'Робота МСЗ-2',
                'chkbxOnWorkSV2':'Робота СВ-2','chkbxOnWorkZNZ2':'Робота ЗНЗ-2', 'chkbxOnResourceVV':'Ресурс ВВ закінчується'};
        htmlObjects['groupKLsources'] = new MultiCheckbox('KL' + klNum+'_SourceOnShields', 'groupKLsources',
                sources, format , false);
    }
    if (bfor_kl4) {
        sources = {'chkbxOnResetBKV':'Скидання по БКВ', 'chkbxOnResetKvit':'Скидання по квитуванню'};
        htmlObjects['chkbxOnResetBKVchkbxOnResetKvit'] = new MultiCheckbox('KL4_ResetAllows', 'chkbxOnResetBKVchkbxOnResetKvit',
                sources, 'BIT021' , false, 'MechanicResetKL4');
    }
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінках налаштування всіх світлодіодів VD
* --------------------------------------------------------------------------------------------------------------------*/
function settingsVDprepate(vdNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування світлодіодного індикатору VD-' + vdNum);
    // -----------------------
    const vdName = 'VD' + vdNum;
    htmlObjects['rdbtnModeVD'] = new RadioGroup(vdName + '_Mode', 'rdbtnModeVD');
    let sources;
    //-----
    sources = {'chkbxOnLaunchMSZ1':'Пуск МСЗ-1', 'chkbxOnWorkMSZ1':'Робота МСЗ-1', 'chkbxOnWorkSV1':'Робота СВ-1',
        'chkbxOnWorkZNZ1':'Робота ЗНЗ-1', 'chkbxOnWorkZZ':'Робота ЗЗ', 'chkbxOnReadyAPV':'Готовність АПВ',
        'chkbxOnLaunchMSZ2':'Пуск МСЗ-2', 'chkbxOnWorkMSZ2':'Робота МСЗ-2', 'chkbxOnWorkSV2':'Робота СВ-2',
        'chkbxOnWorkZNZ2':'Робота ЗНЗ-2', 'chkbxOnWorkACHR':'Робота АЧР', 'chkbxOnWorkAPV':'Робота АПВ',
        'chkbxOnResourceVV':'Ресурс ВВ закінчується'};
    htmlObjects['groupVDsources'] = new MultiCheckbox( vdName + '_SourceOnShields', 'groupVDsources',
                sources, 'BIT024' , false);
    sources = {'rdbtnVDOnDirectDI1': ['nameUseDI1', 'chkbxUseSourceDI1'], 'rdbtnVDOnInverseDI1': ['nameUseDI1', 'chkbxUseSourceDI1'],
        'rdbtnVDOnDirectDI2': ['nameUseDI2', 'chkbxUseSourceDI2'], 'rdbtnVDOnInverseDI2': ['nameUseDI2', 'chkbxUseSourceDI2'],
        'rdbtnVDOnDirectDI3': ['nameUseDI3', 'chkbxUseSourceDI3'], 'rdbtnVDOnInverseDI3': ['nameUseDI3', 'chkbxUseSourceDI3'],
        'rdbtnVDOnDirectDI4': ['nameUseDI4', 'chkbxUseSourceDI4'], 'rdbtnVDOnInverseDI4': ['nameUseDI4',  'chkbxUseSourceDI4'] };
    htmlObjects['groupVDsourcesDI'] = new UseRadioGroup(vdName + '_SourceOnDI','groupVDsourcesDI', sources, 'BIT24A',  vdNum);
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінках налаштування всіх входів DI
* --------------------------------------------------------------------------------------------------------------------*/
function settingsDIprepate(diNum) {
    outHeadToConsole('Підготовка елементів сторінки налаштування дискретного входу DI-' + diNum);
    // -----------------------
    let sources;

    htmlObjects['edtNameDI'] = new NameEdit('DI' + diNum +'_Name','edtNameDI',false,'lblInfoNameDI');
    // ---------------------
    sources = {'rdbtnBlockedDirectMSZ1': ['nameBlockMSZ1', 'chkbxUseBlockedMSZ1'], 'rdbtnBlockedInverseMSZ1': ['nameBlockMSZ1', 'chkbxUseBlockedMSZ1']};
    htmlObjects['groupBlockedMSZ1'] = new UseRadioGroup('MSZ1_LockedByDI','groupBlockedMSZ1', sources, '', diNum);
    //---------------------
    sources = {'rdbtnBlockedDirectMSZ2': ['nameBlockMSZ2', 'chkbxUseBlockedMSZ2'], 'rdbtnBlockedInverseMSZ2': ['nameBlockMSZ2',  'chkbxUseBlockedMSZ2']};
    htmlObjects['groupBlockedMSZ2'] = new UseRadioGroup('MSZ2_LockedByDI','groupBlockedMSZ2', sources, '', diNum);
    //---------------------
    sources = {'rdbtnBlockedDirectSV1': ['nameBlockSV1', 'chkbxUseBlockedSV1'], 'rdbtnBlockedInverseSV1': ['nameBlockSV1', 'chkbxUseBlockedSV1']};
    htmlObjects['groupBlockedSV1'] = new UseRadioGroup('SV1_LockedByDI','groupBlockedSV1', sources, '', diNum);
    //---------------------
    sources = {'rdbtnBlockedDirectSV2': ['nameBlockSV2', 'chkbxUseBlockedSV2'], 'rdbtnBlockedInverseSV2': ['nameBlockSV2',  'chkbxUseBlockedSV2']};
    htmlObjects['groupBlockedSV2'] = new UseRadioGroup('SV2_LockedByDI','groupBlockedSV2', sources, '', diNum);
    //---------------------
    sources = {'rdbtnBlockedDirectZNZ1': ['nameBlockZNZ1', 'chkbxUseBlockedZNZ1'], 'rdbtnBlockedInverseZNZ1': ['nameBlockZNZ1', 'chkbxUseBlockedZNZ1']};
    htmlObjects['groupBlockedZNZ11'] = new UseRadioGroup('ZNZ1_LockedByDI','groupBlockedZNZ11', sources, '', diNum);
    //---------------------
    sources = {'rdbtnBlockedDirectZNZ2': ['nameBlockZNZ2', 'chkbxUseBlockedZNZ2'], 'rdbtnBlockedInverseZNZ2': ['nameBlockZNZ2', 'chkbxUseBlockedZNZ2']};
    htmlObjects['groupBlockedZNZ2'] = new UseRadioGroup('ZNZ2_LockedByDI','groupBlockedZNZ2', sources, '', diNum);
    //---------------------
    htmlObjects['chkbxForACHR'] = new UseCheckbox('ACHR_SourceDI', 'chkbxForACHR',null, diNum, 1);
    htmlObjects['chkbxForZZ'] = new UseCheckbox('ZZ_SourceDI', 'chkbxForZZ',null, diNum, 1);
    // ---------------------
    sources = {'rdbtnDirectBKV': ['rdbtnBKV', 'chkbxUseBKV'], 'rdbtnInverseBKV': ['rdbtnBKV', 'chkbxUseBKV']};
    htmlObjects['groupBKV'] = new UseRadioGroup('APV_SourceDIonBKV','groupBKV', sources, '', diNum);
    //---------------------
    sources = {'rdbtnDirectBlockedAPV': ['rdbtnBlockedAPV', 'chkbxUseBlockedAPV'], 'rdbtnInverseBlockedAPV': ['rdbtnBlockedAPV', 'chkbxUseBlockedAPV']};
    htmlObjects['groupBlockedAPV'] = new UseRadioGroup('APV_LockedByDI','groupBlockedAPV', sources, '',diNum);
    //---------------------
    htmlObjects['chkbxForLaunchAPV'] = new UseCheckbox('APV_LaunchByDI', 'chkbxForLaunchAPV',null, diNum, 1);
    htmlObjects['chkbxForKVIT'] = new UseCheckbox('DIonKvit', 'chkbxForKVIT',null, diNum, 1);
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
* Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування обліку ресурсу вимикача
* --------------------------------------------------------------------------------------------------------------------*/
function settingsVVprepate() {
    outHeadToConsole('Підготовка елементів сторінки налаштування обліку ресурсу вимикача');
    // -----------------------
    let sources = {'chkbxOnWorkMSZ1':'Робота МСЗ-1','chkbxOnWorkMSZ2':'Робота МСЗ-2',
        'chkbxOnWorkSV1':'Робота СВ-1','chkbxOnWorkSV2':'Робота СВ-2',
        'chkbxOnWorkZNZ1':'Робота ЗНЗ-1','chkbxOnWorkZNZ2':'Робота ЗНЗ-2','chkbxOnWorkZZ':'Робота ЗЗ'};
    htmlObjects['groupVVsources'] = new MultiCheckbox( 'VV_ResourceOnShields', 'groupVVsources',
                sources, 'BIT029' , false);
    //-----------------------
    htmlObjects['edtResourceValue'] = new NumEdit('VV_ResourceValue','edtResourceValue', 0, 100, 1);
    htmlObjects['edtResourceEnding'] = new NumEdit('VV_ResourceEndingValue','edtResourceEnding', 0, 50, 1);
    htmlObjects['edtInom'] = new NumEdit('VV_Inom','edtInom', 100, 5000, 10);
    htmlObjects['edtImax'] = new NumEdit('VV_ImaxSwitch','edtImax', 10, 100, 1);
    htmlObjects['edtCountOffInom'] = new NumEdit('VV_SwitchInomMaxCount','edtCountOffInom', 500, 500000, 100);
    htmlObjects['edtCountOffImax'] = new NumEdit('VV_SwitchImaxMaxCount','edtCountOffImax', 10, 1000, 1);
}


/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
*Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування пуску журналу навантажень
* --------------------------------------------------------------------------------------------------------------------*/
function settingsMagazineLoadsprepate() {
    outHeadToConsole('Підготовка елементів сторінки налаштування пуску журналу навантажень');
    // -----------------------
    htmlObjects['edtDateedtTime'] = new DateTimeAs2Edit('LoadMag_LaunchTime', 'edtDate', 'edtTime');
    htmlObjects['spnCount'] = new StaticSpan('LoadMagCounter', 'spnCount', {});
    const value = 'Щоб оце дрантя працювало - треба дописувати нестандартну функцію 24 протоколу modbus :-(';
    htmlObjects['btnReadMagLoad'] = new CommandButton('', 'btnReadMagLoad', value, 'show');
}


/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
*Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування пуску осцилографа
* --------------------------------------------------------------------------------------------------------------------*/
function settingsOSCILOSCOPEprepate() {
    outHeadToConsole('Підготовка елементів сторінки налаштування / роботи осцилографа');
    // -----------------------
    let sources;
    //-----
    sources = {'chkbxOnLaunchMSZ1':'Пуск МСЗ-1', 'chkbxOnWorkMSZ1':'Робота МСЗ-1','chkbxOnLaunchSV1':'Пуск СВ-1',
        'chkbxOnWorkSV1':'Робота СВ-1', 'chkbxOnLaunchZNZ1':'Пуск ЗНЗ-1', 'chkbxOnWorkZNZ1':'Робота ЗНЗ-1',
        'chkbxOnWorkZZ':'Робота ЗЗ', 'chkbxOnLaunchMSZ2':'Пуск МСЗ-2', 'chkbxOnWorkMSZ2':'Робота МСЗ-2',
        'chkbxOnLaunchSV2':'Пуск СВ-2', 'chkbxOnWorkSV2':'Робота СВ-2', 'chkbxOnLaunchZNZ2':'Пуск ЗНЗ-2',
        'chkbxOnWorkZNZ2':'Робота ЗНЗ-2'};
    htmlObjects['groupOscilsources'] = new MultiCheckbox( 'Oscil_SourceOnShields', 'groupOscilsources',
                sources, 'BIT017' , false);
    //-----
    sources = {'chkbxOnDI1':'DI-1 прямо', 'chkbxOnDI2':'DI-2 прямо', 'chkbxOnDI3':'DI-3 прямо', 'chkbxOnDI4':'DI-4 прямо'};
    htmlObjects['groupOscilsourcesDI'] = new MultiCheckbox( 'Oscil_SourcesByDI', 'groupOscilsourcesDI',
                sources, 'BIT17A' , false);
    //-----
    htmlObjects['spnOscilCount'] = new StaticSpan('OscilogramCounter','spnOscilCount',{});
    //-----
    htmlObjects['btnLaunchOscil'] = new CommandButton('Oscil_Launch','btnLaunchOscil','1','sendValue',
        'Пуск осцилографа');
    const value = 'Щоб оце дрантя працювало - треба дописувати нестандартну функцію 41 протоколу modbus :-(';
    htmlObjects['btnReadOscil'] = new CommandButton('','btnReadOscil', value, 'show');
}


/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
*Функція формує глобальний словник активних елементів, що знаходяться на сторінці налаштування дати та часу пристрою
* --------------------------------------------------------------------------------------------------------------------*/
function settingsDATETIMEpeprepate () {
    outHeadToConsole('Підготовка елементів сторінки налаштування дати та часу пристрою');
    // -----------------------
    htmlObjects['lblDateTime'] = new StaticSpan('DateTime','lblDateTime',{}, 11000,
        null, 1000, 'updateDateTime');              // Переініціалізація кожні 11 секунд
    htmlObjects['rdbtnSyncTime'] = new RadioGroup('', 'rdbtnSyncTime', 'MechanicSyncTimeMode');
    htmlObjects['spnDateTimePK'] = new StaticSpan('', 'spnDateTimePK', {}, null, 'initDateTimePK', 1000, 'updateDateTime');   // Без переініціалізації
    //--------Створюємо шість об'єктів вводу числа без ініціалізації -------------
    let objDay = new NumEdit('','edtDay',1,31,1, 'xx');
    let objMonth = new NumEdit('','edtMonth',1,12,1, 'xx');
    let objYear = new NumEdit('','edtYear',2000,2099,1, 'xx');
    let objHour = new NumEdit('','edtHour',0,23,1, 'xx');
    let objMin = new NumEdit('','edtMin',0,59,1, 'xx');
    let objSec = new NumEdit('','edtSec',0,59,1, 'xx');
    let arr = [objDay, objMonth, objYear, objHour, objMin, objSec];
    htmlObjects['groupDateTimePK'] = new DateTimeAs6Edit('DateTime','groupDateTimePK', arr, 1000,
        'rdbtnSyncTime', 'lblDateTime','chkbxSyncForAllDevices');
    //------------------
    htmlObjects['chkbxAutoChangePeriod'] = new UseCheckbox('AutoSvitchTimePeriod','chkbxAutoChangePeriod');
    htmlObjects['chkbxSyncForAllDevices'] = new UseCheckbox('','chkbxSyncForAllDevices');
}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
*       Функція формує глобальний словник активних елементів, що знаходяться на сторінці телеуправління
* --------------------------------------------------------------------------------------------------------------------*/
function TUprepare () {
    outHeadToConsole('Підготовка елементів сторінки телеуправління');
    // -----------------------
    const tu = {'0': 'не дозволено', '1': 'дозволено'};
    const logic = {'0': 'на відключення', '1': 'на включення'};
    htmlObjects['spnNameKL1'] = new StaticSpan('KL1_Name', 'spnNameKL1', {});
    htmlObjects['spnNameKL2'] = new StaticSpan('KL2_Name', 'spnNameKL2', {});
    htmlObjects['spnNameKL3'] = new StaticSpan('KL3_Name', 'spnNameKL3', {});
    htmlObjects['spnNameKL4'] = new StaticSpan('KL4_Name', 'spnNameKL4', {});
    //-----
    htmlObjects['spnAllowTU_KL1'] = new StaticSpan('KL1_TeleControlAllow', 'spnAllowTU_KL1', tu,
        null, null, null,null,'enableKL1btn');
    htmlObjects['spnAllowTU_KL2'] = new StaticSpan('KL2_TeleControlAllow', 'spnAllowTU_KL2', tu,
        null, null, null,null,'enableKL2btn');
    htmlObjects['spnAllowTU_KL3'] = new StaticSpan('KL3_TeleControlAllow', 'spnAllowTU_KL3', tu,
        null, null, null,null,'enableKL3btn');
    htmlObjects['spnAllowTU_KL4'] = new StaticSpan('KL4_TeleControlAllow', 'spnAllowTU_KL4', tu,
        null, null, null,null,'enableKL4btn');
    htmlObjects['spnAllowTU_DSH'] = new StaticSpan('KLD_TeleControlAllow', 'spnAllowTU_DSH', tu,
        null, null, null,null,'enableDSHbtn');
    //-----
    htmlObjects['spnLogicKL1'] = new StaticSpan('KL1_LogicOnOff', 'spnLogicKL1', logic);
    htmlObjects['spnLogicKL2'] = new StaticSpan('KL2_LogicOnOff', 'spnLogicKL2', logic);
    htmlObjects['spnLogicKL3'] = new StaticSpan('KL3_LogicOnOff', 'spnLogicKL3', logic);
    //-----
    let dict = {'0': 'розімкнене', '1': 'замкнене'};
    htmlObjects['spnStatusKL4'] = new StaticSpan('StatusKL','spnStatusKL4', dict, null, null, null,null, 'spnStatusKL4');
    //-----
    for (let i = 1; i<4; i++)
        htmlObjects['btnSwitchKL'+i] = new CommandButton('KL'+i+'_Switch','btnSwitchKL'+i,'1', 'sendValue', 'Подати імпульс від KL-'+i, TUprepare);
    htmlObjects['btnSwitchKL4'] = new CommandButton('KL4_Switch','btnSwitchKL4','<->', 'switchKL4', 'Перемкнути реле', TUprepare);
    htmlObjects['btnSwitchKLD'] = new CommandButton('KLD_Switch','btnSwitchKLD','1', 'sendValue', 'Подати імпульс дешунтування', TUprepare);
    //-----
    htmlObjects['spnInfoBKV'] = new StaticSpan('APV_SourceDIonBKV', 'spnInfoBKV', {}, null, null, null, null, 'spnInfoBKV');
    htmlObjects['spnValueVV'] = new StaticSpan('StatusDI','spnValueVV', {}, null, null, null, null, 'spnValueVV');
    //-----
    htmlObjects['spnListReleOn'] = new StaticSpan('RelayName', 'spnListReleOn', {}, null, null, null, null, 'spnListReleOn');
    htmlObjects['spnListReleOff'] = new StaticSpan('RelayName','spnListReleOff', {}, null, null,null,null,'spnListReleOff');
    //-----
    htmlObjects['btnVVon'] = new CommandButton('VV_On','btnVVon', '1', 'sendValue', 'Увімкнути вимикач', TUprepare);
    htmlObjects['btnVVoff'] = new CommandButton('VV_Off','btnVVoff','1','sendValue', 'Вимкнути вимикач', TUprepare);

}

/*----------------------------------------------------------------------------------------------------------------------
*                                   Частина головного селектора сторінок
*       Функція формує глобальний словник активних елементів, що знаходяться на головній сторінці налаштувань пристрою
* --------------------------------------------------------------------------------------------------------------------*/
function mainPrepare() {
    outHeadToConsole('Підготовка елементів головної сторінки налаштувань пристрою ' + devID);
    // -----------------------
    htmlObjects['btnDateTime'] = new CommandButton('', 'btnDateTime', '', 'openSettings', 'Налаштування дати та часу пристрою');
    // -----------------------
    htmlObjects['spnNameDI1'] = new StaticSpan('DI1_Name','spnNameDI1',{});
    htmlObjects['spnNameDI2'] = new StaticSpan('DI2_Name','spnNameDI2',{});
    htmlObjects['spnNameDI3'] = new StaticSpan('DI3_Name','spnNameDI3',{});
    htmlObjects['spnNameDI4'] = new StaticSpan('DI4_Name','spnNameDI4',{});
    htmlObjects['edtTdempf'] = new NumEdit('DempfTime','edtTdempf',0,250,10);
    // -----------------------
    htmlObjects['spnNameKL1'] = new StaticSpan('KL1_Name','spnNameKL1',{});
    htmlObjects['spnNameKL2'] = new StaticSpan('KL2_Name','spnNameKL2',{});
    htmlObjects['spnNameKL3'] = new StaticSpan('KL3_Name','spnNameKL3',{});
    htmlObjects['spnNameKL4'] = new StaticSpan('KL4_Name','spnNameKL4',{});
    htmlObjects['spnNameKL5'] = new StaticSpan('KL5_Name','spnNameKL5',{});
    // -----------------------
    htmlObjects['edtKts'] = new NumEdit('Ktt','edtKts',1,4000,1);
    htmlObjects['edtKts0'] = new NumEdit('Ktt0','edtKts0',1,4000,1);
    htmlObjects['edtKtn0'] = new NumEdit('Ktn0','edtKtn0',1,4000,1);
    // -----------------------
    htmlObjects['edtNameFider'] = new NameEdit('FiderName','edtNameFider',false, 'lblInfoNameFider');
    // -----------------------
    htmlObjects['cbxKvitDI'] = new ComboDI('DIonKvit', 'cbxKvitDI', 'chkbxUseKvitByDI', '');
    // -----------------------
    htmlObjects['chkbxUseMSZ1'] = new UseCheckbox('MSZ1_Use','chkbxUseMSZ1',['btnSettingMSZ1'],null,0,'chkbxUseMSZ1');
    htmlObjects['chkbxUseMSZ2'] = new UseCheckbox('MSZ2_Use','chkbxUseMSZ2',['btnSettingMSZ2'],null,0,'chkbxUseMSZ2');
    htmlObjects['chkbxUseSV1'] = new UseCheckbox('SV1_Use','chkbxUseSV1',['btnSettingSV1'],null,0,'chkbxUseSV1');
    htmlObjects['chkbxUseSV2'] = new UseCheckbox('SV2_Use','chkbxUseSV2',['btnSettingSV2'],null,0,'chkbxUseSV2');
    htmlObjects['chkbxUseZNZ1'] = new UseCheckbox('ZNZ1_Use','chkbxUseZNZ1',['btnSettingZNZ1'],null,0,'chkbxUseZNZ1');
    htmlObjects['chkbxUseZNZ2'] = new UseCheckbox('ZNZ2_Use','chkbxUseZNZ2',['btnSettingZNZ2'],null,0,'chkbxUseZNZ2');
    htmlObjects['chkbxUseZZ'] = new UseCheckbox('ZZ_Use','chkbxUseZZ',['btnSettingZZ'],null,0,'chkbxUseZZ');
    htmlObjects['chkbxUseACHR'] = new UseCheckbox('ACHR_Use','chkbxUseACHR',['btnSettingACHR'],null,0,'chkbxUseACHR');
    htmlObjects['chkbxUseAPV'] = new UseCheckbox('APV_UseMode','chkbxUseAPV',['btnSettingAPV'], null, 2, 'chkbxUseAPV');
    const dict = {'0':'-----', '1': 'Режим 1-но кратного АПВ', '2': 'Режим 2-х кратного АПВ'};
    htmlObjects['spnMode_APV'] = new StaticSpan('','spnMode_APV', dict);
    // -----------------------
    htmlObjects['btnSettingDI1'] = new CommandButton('', 'btnSettingDI1', '', 'openSettings', 'Налаштування DI-1');
    htmlObjects['btnSettingDI2'] = new CommandButton('', 'btnSettingDI2', '', 'openSettings', 'Налаштування DI-2');
    htmlObjects['btnSettingDI3'] = new CommandButton('', 'btnSettingDI3', '', 'openSettings', 'Налаштування DI-3');
    htmlObjects['btnSettingDI4'] = new CommandButton('', 'btnSettingDI4', '', 'openSettings', 'Налаштування DI-4');
    // -----------------------
    htmlObjects['btnSettingKL1'] = new CommandButton('', 'btnSettingKL1', '', 'openSettings', 'Налаштування KL-1');
    htmlObjects['btnSettingKL2'] = new CommandButton('', 'btnSettingKL2', '', 'openSettings', 'Налаштування KL-2');
    htmlObjects['btnSettingKL3'] = new CommandButton('', 'btnSettingKL3', '', 'openSettings', 'Налаштування KL-3');
    htmlObjects['btnSettingKL4'] = new CommandButton('', 'btnSettingKL4', '', 'openSettings', 'Налаштування KL-4');
    htmlObjects['btnSettingKL5'] = new CommandButton('', 'btnSettingKL5', '', 'openSettings', 'Налаштування KL-5');
    htmlObjects['btnSettingKLD'] = new CommandButton('', 'btnSettingKLD', '', 'openSettings', 'Налаштування Дешунтування');
    // -----------------------
    htmlObjects['btnSettingVD1'] = new CommandButton('', 'btnSettingVD1', '', 'openSettings', 'Налаштування VD-1');
    htmlObjects['btnSettingVD2'] = new CommandButton('', 'btnSettingVD2', '', 'openSettings', 'Налаштування VD-2');
    htmlObjects['btnSettingVD3'] = new CommandButton('', 'btnSettingVD3', '', 'openSettings', 'Налаштування VD-3');
    htmlObjects['btnSettingVD4'] = new CommandButton('', 'btnSettingVD4', '', 'openSettings', 'Налаштування VD-4');
    htmlObjects['btnSettingVD5'] = new CommandButton('', 'btnSettingVD5', '', 'openSettings', 'Налаштування VD-5');
    htmlObjects['btnSettingVD6'] = new CommandButton('', 'btnSettingVD6', '', 'openSettings', 'Налаштування VD-6');
    htmlObjects['btnSettingVD7'] = new CommandButton('', 'btnSettingVD7', '', 'openSettings', 'Налаштування VD-7');
    // -----------------------
    htmlObjects['btnKvit'] = new CommandButton('Kviting','btnKvit', '1','sendValue', 'Квітування', mainPrepare);
    htmlObjects['btnOscil'] = new CommandButton('', 'btnOscil', '', 'openSettings', 'Робота з осцилографом', );
    htmlObjects['btnMagLoad'] = new CommandButton('', 'btnMagLoad', '', 'openSettings', 'Робота з журналом навантажень');
    htmlObjects['btnResourceVV'] = new CommandButton('', 'btnResourceVV', '', 'openSettings', 'Налаштування обліку ресурсу ВВ');
    htmlObjects['btnTeleControl'] = new CommandButton('', 'btnTeleControl', '', 'openSettings', 'Телеуправління');
    // -----------------------
    htmlObjects['btnSettingMSZ1'] = new CommandButton('', 'btnSettingMSZ1', '', 'openSettings', 'Налаштування МСЗ-1');
    htmlObjects['btnSettingMSZ2'] = new CommandButton('', 'btnSettingMSZ2', '', 'openSettings', 'Налаштування МСЗ-2');
    htmlObjects['btnSettingSV1'] = new CommandButton('', 'btnSettingSV1', '', 'openSettings', 'Налаштування СВ-1');
    htmlObjects['btnSettingSV2'] = new CommandButton('', 'btnSettingSV2', '', 'openSettings', 'Налаштування СВ-2');
    htmlObjects['btnSettingZNZ1'] = new CommandButton('', 'btnSettingZNZ1', '', 'openSettings', 'Налаштування ЗНЗ-1');
    htmlObjects['btnSettingZNZ2'] = new CommandButton('', 'btnSettingZNZ2', '', 'openSettings', 'Налаштування ЗНЗ-2');
    htmlObjects['btnSettingZZ'] = new CommandButton('', 'btnSettingZZ', '', 'openSettings', 'Налаштування ЗЗ');
    htmlObjects['btnSettingACHR'] = new CommandButton('', 'btnSettingACHR', '', 'openSettings', 'Налаштування АЧР');
    htmlObjects['btnSettingAPV'] = new CommandButton('', 'btnSettingAPV', '', 'openSettings', 'Налаштування АПВ');
    // -----------------------
}