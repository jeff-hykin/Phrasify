let fs = require('fs')
let words = require('./words.json')
let request = require('request'); // "Request" library

let client_id = 'ae0c7d4b643a4704834c56db9b43be99'; // Your client id
let client_secret = 'c3e1c56556874faca3610eb866f1daf4'; // Your secret
let limit = 50 // how many songs per search
let output_file = 'docs.csv' // where output is saved
let delay_after_getting_rate_limited = 120000 // this is dynmaically increased if there are too many rate limit responses



// a helper for making actual spotify requests
let createOptions = (word, limit, token) => {
    // encode it for the string
    word = encodeURIComponent(word)
    return {
        url: `https://api.spotify.com/v1/search?q=${word}&type=track&limit=${limit}`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };
}

let removeCommas = (word) => {
    return word.replace(/,/g, '')
}

let lastResponseWasRateLimiter = false
let handleResponseErrors = (error, response, body) => {
    statusCode = (response||{}).statusCode
    // log errors
    if (error || statusCode != 200) {
        bodyErrorMessage = ((body||{}).error||{}).message
        console.log('    request ERROR:')
        console.log('        statusCode: ', statusCode)
        console.log(`        body is:`, body)
        console.log(`        error is:`, (error||{}).messge)
        if (bodyErrorMessage) {
            if (lastResponseWasRateLimiter) {
                // if back-to-back "rate limit" errors, then increase the delay time
                // add a second of delay if retry time rate limit is too short
                delay_after_getting_rate_limited += 500
                console.log(`INCREASING DELAY delay is now: ${delay_after_getting_rate_limited}`)
            }
            lastResponseWasRateLimiter = true
            throw { message: bodyErrorMessage }
        } else {
            lastResponseWasRateLimiter = false
        }
        throw error
    } else {
        lastResponseWasRateLimiter = false
    }
}

let asyncSleep = (time_amount)=> new Promise(resolve => 
    {
        setTimeout(()=>{ resolve(null) }, time_amount)
    })

/**
 * This is an example of a basic node.js script that performs
 * the Client Credentials oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#client_credentials_flow
 */
// your application requests authorization
let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + Buffer.from(client_id+':'+client_secret).toString('base64')
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};
let starting_point = 0
let ending_point = 100
// if there is an argument
if (process.argv[2]) {
    starting_point = process.argv[2]
}
if (process.argv[3]) {
    ending_point = process.argv[3]
}
// wrap everything in an async function so that await can be used
let main = async () => {
    for (let i = starting_point; (i < ending_point) && (i < words.length); ++i) {
        try {
            // log every 100 words
            (i % 100 == 0) && console.log(`    ${i} doing word ${words[i]}`)
            // get the credentials (they will be good for about a few minutes or more)
            request.post(authOptions, (error, response, body) => {
                handleResponseErrors(error, response, body)
                options = createOptions(words[i], limit, body.access_token)
                // use the access token to access the Spotify Web API
                request.get(options , (error, response, body) => {
                    handleResponseErrors(error, response, body)
                    statusCode = (response||{}).statusCode
                    results = (((body || {}).tracks || {}).items || [])
                    // check if no results
                    if (results.length == 0) {
                        console.log(`        ${i}: no results found for `, words[i])
                    } else {
                        all_songs_for_this_search = ""
                        // put each of the results on a newline in a string
                        for (let each of results) {
                            // get the artist name if it exists
                            artist_name = ((each.artists||{}) [0]||{}).name
                            // add it to the string
                            all_songs_for_this_search += `${each.id}, ${removeCommas(artist_name)}, ${removeCommas(each.name)}\n`
                        }
                        // save the string to the file
                        fs.appendFile(output_file, all_songs_for_this_search, (error) => {
                            // if there is an error, report it and then exit the whole process
                            if (error) {
                                console.log(`        ERROR on file write: ${error.message}`)
                                process.exit()
                            }
                        })
                    }
                });
            });
        } catch (error) {
            // if its a rate limit error, then wait a little bit
            if (error.message == 'API rate limit exceeded') {
                await asyncSleep(delay_after_getting_rate_limited)
                // retry the last thing if it was a rate limiter error
                i--
            }
        }
    }
}
main()