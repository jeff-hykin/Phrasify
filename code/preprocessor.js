module.exports = function preprocess(input) {
    input = input.trim()
    // replace whitespace with just 1 space
    input = input.replace(/[\s\t\n\r\v]+/, ' ')
    // remove non-letters non-apostrophy
    input = input.replace(/[^\w' ]+/, '')
    // make lowercase
    return input.toLowerCase()
}