let fetch = require("node-fetch")
let preprocess = require('./preprocessor')
let allWords = require("../unique_words.json")

let makeRequest = async (phrase, requestFunction) => {
    uriEncodedPhrase = encodeURI(phrase)
    let requestString = requestFunction(uriEncodedPhrase)
    try {
        let res = await fetch(requestString)
        var data = await res.json()
        console.log(`requestString is:`,requestString)
        console.log(`data.response is:`,data.response)
        return data.response.docs
    } catch(err) {
        console.error("Error getting data from solar:")
        console.error(err)
    }
}

module.exports = {
    songsWithExactPreprocessedTitle: async (phrase) => {
        // return songTable.filter(each => each.preprocessedTitle == title)
        // return makeRequest(phrase, (phrase) =>"http://localhost:8983/solr/songs/select?q=preprocessedTitle:" + phrase )
        return makeRequest(phrase, (phrase) =>"http://localhost:8983/solr/songs/select?q=preprocessedTitle:/" + phrase + "/")
    },
    songsWithPreprocessedTitleThatStartsWith: (phrase) => {
        // return songTable.filter(each => each.preprocessedTitle.startsWith(title))
        return makeRequest(phrase, (phrase) =>"http://localhost:8983/solr/songs/select?q=preprocessedTitle:" + phrase + "*" )
    },
    songsWhosePreprocessedTitleContains: (phrase) => {
        // return songTable.filter( each => each.preprocessedTitle.match(phrase))
        return makeRequest(phrase, (phrase) =>"http://localhost:8983/solr/songs/select?q=preprocessedTitle:/.*" + phrase + ".*/")
    },
    wordExistsInAtLeastOneSong: (word) => allWords[word],
    thereIsAWordThatStartsWith: (partialWord) => {
        for (let each in allWords) {
            if (each.startsWith(partialWord)) {
                return true
            }
        }
        return false
    }
}