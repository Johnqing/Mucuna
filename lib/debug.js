/**
 * Created with JetBrains WebStorm.
 * User: liuqing
 * Date: 14-1-16
 * Time: 上午9:56
 * To change this template use File | Settings | File Templates.
 */
global.logs = {
    Warnings: [],
    Success: [],
    Error: []
}
exports.logger = function(text, lev){
    return;
    if(!lev){
        console.log('[Success]'+text);
        global.logs.Success.push(text);
        return;
    }
    if(lev == 1){
        console.log('[Warning]'+text);
        global.logs.Warnings.push(text);
        return;
    }
    console.log('[Error]'+text);
    global.logs.Error.push(text);
}
