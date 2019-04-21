require("css-baseline/css/super-1.css")
require("roboto-fontface/css/roboto/roboto-fontface.css")
let quik = require("quik-client")
let DropdownInput = require("./code/dropdownInput")
let Song = require("./code/song")
let getPlaylists = quik.backend.getPlaylists
let { blue, green } = require("./code/colors")

// FIXME
    // when connection is lost, typing is allowed but if the server doesn't respond no error message is given 

let dropdownWrapper = (
    <DropdownInput
        input={{
            placeholder: "Start typing a sentence",
            autofocus: true,
            oninput: onInput,
            style: {
                border: "none",
                borderBottom: "solid gray 2px",
                fontSize: "1.2rem",
                paddingTop: "0.4rem",
            },
        }}
        dropdown={{
            style: {
                padding: "0.2rem",
                color: "gray",
                height: "5.3em",
                overflow: "scroll",
            },
        }}
    />
)

let confirmedSongsContainer = (
    <div
        style={{
            backgroundColor: green,
            width: "100%",
            overflowY: 'auto',
            minHeight: "50vh",
            maxHeight: "50vh",
            color: "white",
            justifyContent: "flex-start",
            marginTop: "1rem",
            paddingTop: "1.6rem",
            flexDirection: "column",
        }}
    >
        No songs yet ¯\_(ツ)_/¯
    </div>
)

let messageContainer = (
    <div
        style={{
            height: "10vh",
            alignItems: "flex-end",
            fontWeight: "bold",
        }}
    >
        <span>Hello</span>
    </div>
)

document.head = (
    <head>
        <title>Phraseify</title>
    </head>
)

document.body = (
    <body>
        <div style="height: 15vh;" />
        <h2 style={{ minHeight: "1em", fontFamily: "Roboto", fontWeight: 100 }}>Phraseify</h2>
        {messageContainer}
        {dropdownWrapper}
        {confirmedSongsContainer}
    </body>
)

//
// setup the dropdown
//
let confirmedSongs = []
async function onInput(e) {
    let currentText = e.target.value
    try {
        console.log(`currentText is:`, currentText)
        var results = await getPlaylists(currentText, confirmedSongs)
    } catch (e) {
        console.log(`There was an error on the backend`, e.message)
    }
    confirmedSongs = results.confirmedSongs
    let { startMatches, messages } = results
    //
    // Change UI of Confirmed songs
    //
    // remove all the old songs
    confirmedSongsContainer.children = []
    // add the new songs
    for (let each of confirmedSongs) {
        console.log('adding confirmed song')
        confirmedSongsContainer.add(<Song {...each} />)
    }
    if (confirmedSongsContainer.children.length == 0) {
        confirmedSongsContainer.add("No songs yet ¯\\_(ツ)_/¯ ")
    }
    //
    // Change the UI of the Suggested songs
    //
    dropdownWrapper.dropdown.children = []
    // add the new suggestions
    for (let each of startMatches) {
        dropdownWrapper.dropdown.add(<span>{`${each.title}`}</span>)
    }
    //
    // Change the UI of messages if there are any
    //
    messageContainer.children = []
    for (let each of messages) {
        messageContainer.add(<span>{each}</span>)
    }
}
