function to_array(input){
    if(!input|| input == null || input == '')  return [];
    if(Array.isArray(input)) return input;
    return [input];
}


module.exports = {
    to_array
}