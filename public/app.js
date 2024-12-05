/*!
 * Author: Franz Chuquirachi
 * Program: app.js
 * Date Created: November 28, 2024
 * Copyright (c) 2024, Franz Arthur Chuquirachi Rosales. All rights reserved.
 */

async function fetchDirectoryTree(startNodeType) {
	console.log(`[Frontend] Fetching directory tree for startNodeType: ${startNodeType}`);
	try {
		const response = await fetch(`/get-tree?startingClassName=${startNodeType}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch tree: ${response.statusText}`);
		}
		const tree = await response.json();
		console.log(`[Frontend] Directory tree received:`, tree);
		return tree;
	} catch (error) {
		console.error(`[Frontend] Error fetching directory tree:`, error);
		alert("Failed to fetch directory tree. Please check the server.");
	}
}

/*
function treeToMarkdown(tree, level = 0) {
	const indent = "  ".repeat(level);
	let markdown = "";
	
	tree.forEach((node) => {
		markdown += `${indent}- ${node.name}\n`;
		
		if (node.userNo) {
			node.userNo.forEach((userInstance) => {
				markdown += `${indent}  - User Instance: ${userInstance.name}\n`;
				
				userInstance.activities.forEach((activity) => {
					markdown += `${indent}    - Activity: ${activity.name}\n`;
					
					activity.trialNo.forEach((trial) => {
						markdown += `${indent}      - Trial: ${trial.name}\n`;
						
						trial.files.forEach((file) => {
							markdown += `${indent}        - File: ${file}\n`;
						});
					});
				});
			});
		}
		
		if (node.users) {
			node.users.forEach((user) => {
				markdown += `${indent}  - User: ${user.name}\n`;
				
				user.userNo.forEach((userInstance) => {
					markdown += `${indent}    - User Instance: ${userInstance.name}\n`;
					
					userInstance.trialNo.forEach((trial) => {
						markdown += `${indent}      - Trial: ${trial.name}\n`;
						
						trial.files.forEach((file) => {
							markdown += `${indent}        - File: ${file}\n`;
						});
					});
				});
			});
		}
	});
	
	console.log(`[Frontend] Markdown generated:\n${markdown}`);
	return markdown;
}
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


document.getElementById("generateBtn").addEventListener("click", async () => {
	console.log(`[Frontend] Generate button clicked.`);
	const startNodeType = document.getElementById("startNodeType").value;
	console.log(`[Frontend] Selected startNodeType: ${startNodeType}`);
	const tree = await fetchDirectoryTree(startNodeType);
	
	if (tree) {
		console.log(`[Frontend] Converting directory tree to Markdown.`);
		const markdownContent = '# Data Collection\n' + treeToMarkdown(tree);
		document.getElementById("markdownOutput").textContent = markdownContent;
		console.log(`[Frontend] Markdown content displayed.`);
		console.log(`${markdownContent}`);
		
//		const markdownHeight = document.getElementById('markdownOutput').offsetHeight; // Get the height in pixels
		const markdownOutput = document.getElementById('markdownOutput'); // Get the element
		const markdownHeight = window.getComputedStyle(markdownOutput).height;
		console.log(`[Frontend] Rendered markdownOutput height is ${markdownHeight}.`);
		
		const markdownContentwOptions = '---\nmarkmap:\n  colorFreezeLevel: 5\n---\n\n' + markdownContent;
		console.log(`[Frontend] Markdown content with options displayed.`);
		console.log(`${markdownContentwOptions}`);
		
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
		markmap.autoLoader.renderAll();
		console.log(`[Frontend] Markmap content displayed.`);
	} else {
		console.warn(`[Frontend] Tree data is null. Markdown conversion skipped.`);
	}
});
