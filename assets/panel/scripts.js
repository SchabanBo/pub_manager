
/// <summary>
/// Update the package
/// </summary>
const vscode = acquireVsCodeApi();
function handleUpdateClick(package, version) {
    vscode.postMessage({ command: 'updatePackage', package, version });
}

function handleAddPackageClick() {
    vscode.postMessage({ command: 'addPackage' });
}

function handleRemoveClick(packageName) {
    const message = {
        command: 'removePackage',
        package: packageName,
    };
    vscode.postMessage(message);
}

/// <summary>
/// Reloads the panel content
/// </summary>
const refreshButton = document.getElementById('refreshButton');
refreshButton.addEventListener('click', () => {
    vscode.postMessage({ command: 'refreshPanel' });
});


const analyzeButton = document.getElementById('analyzeButton');
const loadingMessage = document.getElementById('loadingMessage');
const unusedFilesList = document.getElementById('unusedFilesList');

analyzeButton.addEventListener('click', () => {
    loadingMessage.style.display = 'block';
    unusedFilesList.innerHTML = '';

    vscode.postMessage({ command: 'analyzeProject' });
});

// Handle messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'displayResults') {
        loadingMessage.style.display = 'none';
        unusedFilesList.innerHTML = message.results;
        unusedFilesList.style.display = 'block';
    }
});