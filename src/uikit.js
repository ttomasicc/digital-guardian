exports.createKeyInfoArticle = ({name, size, modified}) => `
        <article>
            <header><strong>${ name ? name : 'Unknown' }</strong></header>
            <strong>Size:</strong> ${ size ? size : '0' }B
            <br>
            <strong>Modified Date:</strong> ${ modified ? modified.toLocaleDateString() : 'Not recorded' }
            <br>
            <strong>Modified Time:</strong> ${ modified ? modified.toLocaleTimeString() : 'Not recorded' }
        </article>`
