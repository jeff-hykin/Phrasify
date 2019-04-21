let data = require('./databaseUtils')
let preprocess = require('./preprocessor')

function removeConfirmedPart(unconfirmedPart, confirmedSongs) {
    console.log(`unconfirmedPart before is:`,unconfirmedPart)
    let unconfirmedWords = unconfirmedPart.split(' ')
    let reconfirmedSongs = []
    for (let eachConfirmedSong of confirmedSongs) {
        let wordsInTitle = eachConfirmedSong.preprocessedTitle.split(' ')
        let maybeUnconfirmedWords = [...unconfirmedWords]
        let fullyConfirmed = true
        for (let eachConfirmedTitleWord of wordsInTitle) {
            let nextUnconfirmedWord = maybeUnconfirmedWords.pop()
            if (eachConfirmedTitleWord != nextUnconfirmedWord) {
                fullyConfirmed = false
                break
            }
        }
        
        if (!fullyConfirmed) {
            unconfirmedPart = unconfirmedWords.join(' ')
            break
        }
        // update the unconfirmed words
        unconfirmedWords = maybeUnconfirmedWords
        reconfirmedSongs.push(eachConfirmedSong)
    }
    return [unconfirmedPart, reconfirmedSongs]
}

let getPlaylists = async (input, confirmedSongs) => {
    // 
    // validate input
    // 
        console.log(`input is:`,input)
        console.log(`confirmedSongs is:`,confirmedSongs)
        if (typeof input != 'string') {
            console.log(`input is not a string`)
            throw Error('The input to getPlaylists() needs to be a string')
        }

    // 
    // remove confirmed part
    // 
        let preprocessedInput = preprocess(input)
        console.log(`preprocessedInput is:`,preprocessedInput)
        let [unconfirmedPart, reconfirmedSongs] = removeConfirmedPart(preprocessedInput, confirmedSongs)
        console.log(`unconfirmedPart is:`,unconfirmedPart)
        confirmedSongs = reconfirmedSongs

    // 
    // Base case
    // 
        if (unconfirmedPart.length == 0) {
            return {
                confirmedSongs,
                startMatches: [],
                messages:     [],
            }
        }
    
    // 
    // Simple Seach & Suggest
    // 
        // partial-matches (suggestions)
        let startMatches = await data.songsWithPreprocessedTitleThatStartsWith(unconfirmedPart)
        // perfect matches
        let perfectMatches = await data.songsWithExactPreprocessedTitle(unconfirmedPart)
    // 
    // Verify Simple Seach & Suggest
    // 
        // if there is at least one perfect match, then return the results
        if (perfectMatches.length > 0) {
            confirmedSongs.push(perfectMatches.pop())
            return {
                confirmedSongs,
                startMatches,
                messages: [],
            }
        }
    // 
    // pre-matches
    // 
        // if you can confirm the begining of the unconfirmed part, then do that first
        let preWords = unconfirmedPart.split(' ')
        for (let each of [...preWords]) {
            // todo: optimize this
            preWords.pop()
            if (preWords.length == 0) {
                break;
            }
            let prePhrase = preWords.join(' ')
            // TODO: this query can be opmimized out with the "backup-plan list" being added to the SQL db
            let preMatch = await data.songsWithExactPreprocessedTitle(prePhrase)
            if (preMatch.length > 0) {
                confirmedSongs.push(preMatch[0])
                return getPlaylists(preprocessedInput, confirmedSongs)
            }
        }

    // 
    // Check for impossibility
    // 
        console.log(`no simple match, checking for impossibility`)
        let words = unconfirmedPart.split(' ')
        let lastWord = words.pop()
        // make sure every middle word exists
        for (let each of words) {
            // if the word doesn't exist, then the match is impossible
            if (!(await data.wordExistsInAtLeastOneSong(each))) {
                console.log(`one of the middle words doesnt exist`)
                return {
                    confirmedSongs,
                    startMatches,
                    messages: [ `The word '${each}' isnt in any song :/` ],
                    noSolution: true,
                }
            }
        }
        // if the word doesn't exist
        if (!(await data.wordExistsInAtLeastOneSong(lastWord))) {
            // if there is a partial, then wait for the user to type more
            if (await data.thereIsAWordThatStartsWith(lastWord)) {
                console.log(`the last word is only a partial match`)
                return {
                    confirmedSongs,
                    startMatches,
                    messages: [ "No exact match" ],
                    noSolution: true,
                }
            // if there is no partial then tell the user it's impossible
            } else {
                console.log(`the last word doesnt even exist as a partial match`)
                return {
                    confirmedSongs,
                    startMatches,
                    messages: [ "Impossible statement with current songs :/" ],
                    noSolution: true,
                }
            }
        }
        console.log(`the words at least exist somewhere, checking for deconstruction`)
    // 
    // Failure to match, but not obviously impossible
    //
        // ex:
            // string         =   "hi so nice to see you i wonder how you have been"
            // confirmedSongs = [ "hi so nice to see you", "i wonder", "how", "you" ]
            // failure to match "have been"
        // check for possible solutions
        // TODO could use inverted index to speed up this search
        let alternatives = await data.songsWhosePreprocessedTitleContains(unconfirmedPart)
        console.log(`alternatives is:`,alternatives)
        // ex:
            // "i have been great"
            // "you have been gone"
            // "we have been friends"
            // "you have been"
        // find solutions that could fit
        let possibleViableSolutions = alternatives.filter( each => input.endsWith(each.preprocessedTitle) )
        console.log(`possibleViableSolutions is:`,possibleViableSolutions)
        // ex:
            // "you have been"
        
    // 
    // Attempt Deconstruction (try to make the viableSolution fit) ~O(n!)
    // 
        for (let eachSong of possibleViableSolutions) {
            // first remove the solution from the ending
            let inputAccountingForSolution = preprocessedInput.substring(0, preprocessedInput.length - eachSong.preprocessedTitle.length)
            // become recursive
            let results = await getPlaylists(inputAccountingForSolution, confirmedSongs)
            // if there is an exact match, then the Deconstruction was successful
            if (!results.noSolution) {
                results.confirmedSongs.push(eachSong)
                return results
            }
        }
    // 
    // Worst case scenario
    // 
        // all Deconstructions failed, (or no possible viable solutions)
        // TODO: improve the suggestions at this point by taking the non-exact matched of the possibleViableSolutions
        return {
            confirmedSongs,
            startMatches,
            messages: [ "No exact match" ],
            noSolution: true,
        }
}

// this is just for debugging, normally it would export getPlaylists directly 
module.exports =  async (...args) => {
    let output = {
        confirmedSongs: [], // list of songs
        startMatches: [], // list of songs
        messages:     [], // list of objects, things like: if a particular word doesn't exist
    }
    try {
        output = await getPlaylists(...args)
        console.log(`output is:`,output)
    } catch (e) {
        console.log(`e is:`,e)
    }
    return output
}