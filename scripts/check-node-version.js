if (process.versions.node.split('.')[0] < 20) {
    console.error(
        'You are running Node ' +
            process.versions.node +
            '.\n' +
            'This project requires Node 20 or higher. \n' +
            'Please update your version of Node.',
    )
    process.exit(1)
}
