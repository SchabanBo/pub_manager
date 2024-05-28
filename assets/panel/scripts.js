
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

const packagesLoadingMessage = document.getElementById('packagesLoadingMessage');
const packagesTable = document.getElementById('packagesTable');
const analyzeButton = document.getElementById('analyzeButton');
const analyzerLoadingMessage = document.getElementById("analyzerLoadingMessage");
const unusedFilesList = document.getElementById('unusedFilesList');

analyzeButton.addEventListener('click', () => {
    analyzerLoadingMessage.style.display = "block";
    unusedFilesList.innerHTML = '';

    vscode.postMessage({ command: 'analyzeProject' });
});

// Handle messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'displayAnalyzerResults') {
        analyzerLoadingMessage.style.display = "none";
        unusedFilesList.innerHTML = message.results;
        unusedFilesList.style.display = 'block';
    }
    if (message.command === "displayPackagesResults") {
        packagesLoadingMessage.style.display = "none";
        packagesTable.innerHTML = message.results;
        packagesTable.classList.remove('hidden');
    }
});

function toggleExpandableRow(index) {
    const row = document.getElementById('row-' + index);
    const expandableRow = document.getElementById('expandable-row-' + index);
    if (expandableRow.style.display === 'none') {
        row.style.boxShadow = 'inset 0 0 0 1000px rgb(75 75 75/ 20%)';
        row.style.borderBottom = 'none';
        expandableRow.style.display = '';
    } else {
        row.style.removeProperty('box-shadow');
        row.style.removeProperty('border-bottom');
        expandableRow.style.display = 'none';
    }
}