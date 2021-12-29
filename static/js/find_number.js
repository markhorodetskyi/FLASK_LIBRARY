// document.getElementById("get_result").onclick = function() {
//     console.log('data')
//     $.ajax({
//     type: 'GET',
//     async: true,
//     number: document.getElementById('number').value,
//     url: window.location.href+'find_number/'+number,
//     success: function(data) {
//         console.log(data)
//         // for (let cell in cells) {
//         //     if(cells[cell].fid_num in data){
//         //         for(let objects in cells[cell]['objects']){
//         //             if('CellBus' == cells[cell]['objects'][objects]['selfName']){
//         //                 cells[cell]['objects'][objects]['lefttext'] = data[cells[cell].fid_num]['date'];
//         //                 cells[cell]['objects'][objects].updateBlock();
//         //             }
//         //             if('CellSwitch' == cells[cell]['objects'][objects]['selfName']){
//         //                 cells[cell]['objects'][objects]['currents'] = [
//         //                     parseFloat(data[cells[cell].fid_num]['current']['a']),
//         //                     parseFloat(data[cells[cell].fid_num]['current']['b']),
//         //                     parseFloat(data[cells[cell].fid_num]['current']['c']),
//         //                 ]
//         //                 cells[cell]['objects'][objects].updateBlock();
//         //             }
//         //             if('CellPanelVD' == cells[cell]['objects'][objects]['selfName']){
//         //                 cells[cell]['objects'][objects]['status'] = data[cells[cell].fid_num]['vd']['1']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['2']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['3']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['4']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['5']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['6']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['7']['status']+
//         //                     +data[cells[cell].fid_num]['vd']['8']['status'];
//         //                 cells[cell]['objects'][objects].updateBlock();
//         //             }
//         //         }
//         //     }
//
//
//   //       }
//   //     // console.log(data)
//     },
//     dataType: 'json',
//   });
//   });
// });
var history_number = null
function get_result(){
    number = document.getElementById('number').value
    if(history_number){
        history_number = '[id=id_'+history_number.toString()+']'
        $(str_number).removeClass('table-success');
    }
    str_number = '[id=id_'+number.toString()+']'
    console.log(str_number)
    $.ajax({
        type: 'GET',
        url: 'find_number/'+number+'/',
        success: function(result) {
            $(str_number).addClass('table-success');
            history_number = number
            document.getElementById("incolumns").innerHTML=result['column']
            document.getElementById("inrows").innerHTML=result['rows']
            console.log(result)
        },
        dataType: 'json',
    });
};