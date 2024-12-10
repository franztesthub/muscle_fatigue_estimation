/*!
 * Author: Franz Chuquirachi
 * Program: app.js
 * Date Created: November 28, 2024
 * Copyright (c) 2024, Franz Arthur Chuquirachi Rosales. All rights reserved.
 */

/**
 * Fetches the directory tree structure from the server starting from the specified node type.
 *
 * This function sends a GET request to the `/get-tree` endpoint with the `startingClassName` query parameter
 * to retrieve the directory tree structure. It logs the process to the console and returns the tree structure
 * if successful. In case of an error, it logs the error and displays an alert to the user.
 *
 * @param {string} startNodeType - The starting class name for the directory tree (e.g., "user" or "activity").
 * @returns {Promise<Object|null>} - A promise resolving to the directory tree object if successful, or `null` if an error occurs.
 */
async function fetchDirectoryTree(startNodeType) {
	console.log(`[Frontend] Fetching directory tree for startNodeType: ${startNodeType}`);
	const response = await fetch(`/get-tree?startingClassName=${startNodeType}`);
	const responseData = await response.json();
		if (!response.ok) {
			console.error(`[Frontend] Error while fetching directory tree:`, responseData.error_msg);
			alert(`Error while fetching directory tree: ${responseData.error_msg} Please check the server.`);
		}
	const tree = responseData.tree;
	if (responseData.tree) {
		console.log(`[Frontend] Directory tree received:`, tree);
	}
	return tree;
}

/**
 * Converts a hierarchical tree structure into a Markdown-formatted string.
 *
 * @param {Array<Object>} tree - An array of tree nodes, each consisting of a `name` (string) and `children` (array) property.
 * @param {number} [level=0] - The current depth level in the tree hierarchy (used for indentation).
 * @returns {string} - A Markdown-formatted string representing the tree structure.
 *
 * @example
 * const tree = [
 *   { name: "User1", children: [
 *     { name: "Activity1", children: [
 *       { name: "Trial1", children: [
 *         { name: "File1" }
 *       ]}
 *     ]}
 *   ]}
 * ];
 *
 * const markdown = treeToMarkdown(tree);
 * console.log(markdown);
 * // Outputs:
 * // ## User1
 * // - Activity1
 * //   - Trial1
 * //     - File1
 */
function treeToMarkdown(tree, level = 0) {
	const indent = '  '.repeat(level); // Indentation for hierarchy
	let markdown = '';
	
	// Iterate over each node in the tree
	tree.forEach((node) => {
		if (level === 0) {
			markdown += `${indent}## ${node.name.charAt(0).toUpperCase() + node.name.slice(1)}\n`;
		}
		else {
			markdown += `${indent}- ${node.name}\n`;
		}
		
		// If the node has children, recursively process them
		if (Array.isArray(node.children) && node.children.length > 0) {
			markdown += treeToMarkdown(node.children, level + 1);
		}
	});
	
	//	console.log(`[Frontend] Markdown content for level ${level}:\n`, markdown);
	return markdown;
}

/**
 * Event listener for the "Generate" button to generate and display a directory tree in Markdown format.
 *
 * This function is triggered when the user clicks the "Generate" button. It fetches the directory tree
 * based on the selected start node type, converts it to Markdown, and displays the result in the DOM.
 * Additionally, it prepares and renders the Markmap visualization of the generated Markdown content.
 *
 * @async
 * @function
 *
 * @example
 * // HTML structure:
 * <select id="startNodeType">
 *   <option value="user">User</option>
 *   <option value="activity">Activity</option>
 * </select>
 * <button id="generateBtn">Generate</button>
 * <pre id="markdownOutput"></pre>
 * <div id="markmapCanvas"></div>
 *
 * // Event listener attached to the button:
 * document.getElementById("generateBtn").addEventListener("click", async () => { ... });
 *
 * @steps
 * 1. Logs a message indicating the button was clicked.
 * 2. Retrieves the `startNodeType` selected by the user.
 * 3. Calls `fetchDirectoryTree()` with the selected start node type to fetch the directory tree from the server.
 * 4. Converts the fetched directory tree into Markdown format using `treeToMarkdown()`.
 * 5. Displays the Markdown content in the `#markdownOutput` DOM element.
 * 6. Calculates the height of the Markdown output element for Markmap rendering.
 * 7. Appends Markmap-specific configuration to the Markdown content and inserts it into the `#markmapCanvas` DOM element.
 * 8. Renders the Markmap visualization using `markmap.autoLoader.renderAll()`.
 *
 * @see fetchDirectoryTree
 * @see treeToMarkdown
 */
document.getElementById("generateBtn").addEventListener("click", async () => {
	console.log(`[Frontend] Generate button clicked.`);
	// Retrieve the selected start node type
	const startNodeType = document.getElementById("startNodeType").value;
	console.log(`[Frontend] Selected startNodeType: ${startNodeType}`);
	// Fetch the directory tree data
	const tree = await fetchDirectoryTree(startNodeType);
	if (tree) {
		console.log(`[Frontend] Converting directory tree to Markdown.`);
		// Convert the tree to Markdown format
		const markdownContent = '# Data Collection\n' + treeToMarkdown(tree);
		// Display the Markdown content in the output element
		document.getElementById("markdownOutput").textContent = markdownContent;
		console.log(`[Frontend] Markdown content displayed.`);
		console.log(`${markdownContent}`);
		// Calculate the height of the rendered Markdown output element
//		const markdownHeight = document.getElementById('markdownOutput').offsetHeight; // Get the height in pixels
		const markdownOutput = document.getElementById('markdownOutput'); // Get the element
		const markdownHeight = window.getComputedStyle(markdownOutput).height;
		console.log(`[Frontend] Rendered markdownOutput height is ${markdownHeight}.`);
		// Append Markmap-specific options and prepare for rendering
		const markdownContentwOptions = '---\nmarkmap:\n  colorFreezeLevel: 5\n---\n\n' + markdownContent;
		console.log(`[Frontend] Markdown content with options loaded to DOM.`);
		console.log(`${markdownContentwOptions}`);
		// Inject the Markmap configuration into the canvas element
		document.getElementById("markmapCanvas").innerHTML = `
		<style>
		    .markmap > svg {
			    height: ${markdownHeight};
		        width: 100%;
			}
		</style>
        <div class="markmap">
	        <script type="text/template">
	            ${markdownContentwOptions}
	        </script>
        </div>
        `;
		// Inject the Markmap configuration into the canvas element
		markmap.autoLoader.renderAll();
		console.log(`[Frontend] Markmap content rendered.`);
	} else {
		console.warn(`[Frontend] Tree data is null. Markdown conversion skipped.`);
	}
});
