/// <summary>
/// Update the package
/// </summary>
const vscode = acquireVsCodeApi();
const packagesLoadingMessage = document.getElementById(
  "packagesLoadingMessage"
);
const packagesTable = document.getElementById("packagesTable");
const analyzerLoadingMessage = document.getElementById(
  "analyzerLoadingMessage"
);
const unusedFilesList = document.getElementById("unusedFilesList");
const liceenseContainer = document.getElementById("licensesContainer");
const flutterVersion = document.getElementById("flutterVersion");

// Handle messages from the extension
window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.command === "displayAnalyzerResults") {
    analyzerLoadingMessage.style.display = "none";
    unusedFilesList.innerHTML = message.results;
    unusedFilesList.style.display = "block";
  }
  if (message.command === "displayPackagesResults") {
    packagesLoadingMessage.style.display = message.results.ready
      ? "none"
      : "block";
    packagesTable.innerHTML = message.results.table;
    liceenseContainer.innerHTML = message.results.licenses;
    packagesTable.classList.remove("hidden");
    sorttable.makeSortable(packagesTable);
  }
  if (message.command === "displayFlutterVersion") {
    flutterVersion.innerHTML = "";
    for (const version of message.results) {
      flutterVersion.innerHTML += `<li>${version}</li>`;
    }
  }
});

function handleUpdateClick(package, version) {
  vscode.postMessage({ command: "updatePackage", package, version });
}

function handleAddPackageClick() {
  vscode.postMessage({ command: "addPackage" });
}

function handleRemoveClick(packageName) {
  const message = {
    command: "removePackage",
    package: packageName,
  };
  vscode.postMessage(message);
}

function handleUpdateAllClick() {
  vscode.postMessage({ command: "updateAllPackages" });
}

/// <summary>
/// Reloads the panel content
/// </summary>
function handleRefreshClick() {
  vscode.postMessage({ command: "refreshPanel" });
}

function handleAnalyzeClick() {
  analyzerLoadingMessage.style.display = "block";
  unusedFilesList.innerHTML = "";
  vscode.postMessage({ command: "analyzeProject" });
}

function toggleExpandableRow(index) {
  const row = document.getElementById("row-" + index);
  const expandableRow = document.getElementById("expandable-row-" + index);
  if (expandableRow.style.display === "none") {
    row.style.boxShadow = "inset 0 0 0 1000px rgb(75 75 75/ 20%)";
    row.style.borderBottom = "none";
    expandableRow.style.display = "";
  } else {
    row.style.removeProperty("box-shadow");
    row.style.removeProperty("border-bottom");
    expandableRow.style.display = "none";
  }
}
