let {StyleSheet, css} = require('aphrodite-jss')
let { slate } = require('./colors')

const sheet = StyleSheet.create({
    wrapper: {
        background: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '100vh',
        color: slate,
        marginBottom: '0.5em'
    },
    title: {
        fontWeight: 'bold',
        paddingRight: '1em'
    },
    by: {
        paddingRight: '0.5em'
    },
    artist: {
        textDecoration: 'underline'
    }
})

module.exports = function({ title, artist }) {
    return <div class={css(sheet.wrapper)}>
            <span class={css(sheet.title)} >{title}</span>
            <span class={css(sheet.by)}>By:</span>
            <span class={css(sheet.artist)}>{artist}</span>
        </div>
}