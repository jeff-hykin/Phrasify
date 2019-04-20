let { StyleSheet, css } = require('aphrodite-jss')

const sheet = StyleSheet.create({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content'
    },
    dropdown: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%'
    }
})

module.exports = ({ wrapper, input, dropdown, children }) => {
    let elements = {}
    let output
    output = <div class={css(sheet.wrapper)} {...wrapper}>
        {elements.input = <input {...input} />}
        {elements.dropdown = <div class={css(sheet.dropdown)} {...dropdown}>
            {children}
        </div>}
    </div>
    output.input = elements.input
    output.dropdown = elements.dropdown
    return output
}