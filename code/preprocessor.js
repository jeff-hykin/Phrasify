module.exports = function preprocess(input) {
    // make lowercase
    input = input.toLowerCase()
    // replace amperstands with &
    input = input.replace(/&/, ' and ')
    // remove non-letters
    input = input.replace(/[^\w ]+/, '')
    // replace whitespace with just 1 space
    input = input.replace(/[\s\t\n\r\v]+/, ' ')
    // remove trailing whitespace
    input = input.trim()

    return input
}