/*!
 * Author: Franz Chuquirachi
 * Program: visualization-tool.js
 * Date Created: November 29, 2024
 * Copyright (c) 2024, Franz Arthur Chuquirachi Rosales. All rights reserved.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));
console.log(`[Backend] Static files served from /public.`);

// Allowed instances names of each class
/*
const INSTANCE_NAMES = {
    // className : ["instance_name"]
    user: ["user"],
    activity: [
        "dynamic_endurance_bicep_curls_standing",
        "max_endurance_elbow_flexion_standing",
    ],
    data_type: ["emg", "skeleton", "body_composition"],
};
 */
const INSTANCE_NAMES = JSON.parse(fs.readFileSync('instanceNames.json', 'utf8'));

/**
 * Validates if a folder name starts with any of the registered instances names.
 * @param {string} name - The name to validate.
 * @param {string} className - The instance's class ('user', 'activity', or 'data_type').
*/
function isValidInstance(name, className) {
    if (!INSTANCE_NAMES[className]) {
//        console.error(`Invalid type: ${type}`);
		throw new Error(`Invalid class name: ${className}`);
        return false;
    }
    return INSTANCE_NAMES[className].some((prefix) => name.startsWith(prefix));
}

/**
 * Filters directories in a given folder based on class name.
 * @param {string} folderPath - The path of the folder to scan.
 * @param {string} className - The class name to validate ('user', 'activity').
 * @returns {Array} - An array of directory entries that match the criteria.
 
function getVerifiedFolders(folderPath, className) {
    return fs.readdirSync(folderPath, { withFileTypes: true }).filter(
                                                                      (entry) => entry.isDirectory() && isValidInstance(entry.name, className)
                                                                      );
}
*/

/**
 * Groups directories in a given folder based on class name and its allowed instances names.
 * @param {string} folderPath - The path of the folder to scan.
 * @param {string} className - The class name to validate ('user', 'activity', 'data_type').
 * @returns {Object} - An object where keys are instances names and values are arrays of matching directories.
 */
function getGroupedFolders(folderPath, className) {
    const leadingNames = INSTANCE_NAMES[className];
    if (!leadingNames) {
        throw new Error(`Invalid class name: ${className}`);
    }
    
    // Initialize result object with keys for each leading name
    const groupedFolders = Object.fromEntries(leadingNames.map(name => [name, []]));
    
    // Read and group folders
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    entries.forEach(entry => {
        if (entry.isDirectory()) {
            leadingNames.forEach(name => {
                if (entry.name.startsWith(name)) {
                    groupedFolders[name].push(entry.name);
                }
            });
        }
    });
    
    return groupedFolders;
}



/**
 * Build the directory tree, starting from the `data_collection` folder.
 */
function buildTree(rootFolder, startingClassName) {
    const tree = [];
    
    if (startingClassName === 'user'){
		specificActivityName = null;
		// Loop through user folders
		const userGroups = getGroupedFolders(rootFolder, 'user');
		Object.entries(userGroups).forEach(([userInstanceName, userFolders]) => {
			const user = {
				name : userInstanceName,
				children : []
//				userNo : []
			}
			userFolders.forEach(userFolder => {
				console.log(`Processing user folder: ${userFolder}`);
				const userPath = path.join(rootFolder, userFolder);
				const userInstance = {
				    name: userFolder.split("_")[1], // Extract user number (e.g., "01")
				    children: [],
//				    activities: [],
				}
				// Process activities within this user folder
				const activityGroups = getGroupedFolders(userPath, 'activity');
				Object.entries(activityGroups)
				.filter(([activityInstanceName, activityFolders]) =>
						specificActivityName ? activityInstanceName === specificActivityName : true
						)
				.forEach(([activityInstanceName, activityFolders]) => {
					const activity = {
						name : activityInstanceName,
						children : [],
//						trialNo : [],
					}
					activityFolders.forEach(activityFolder => {
						console.log(`Processing activity folder: ${activityFolder}`);
						const activityPath = path.join(userPath, activityFolder);
						const trial = {
						    name: activityFolder.split("_").pop(), // Extract activity trial number (e.g., "01")
						    children: [],
//						    files: [],
						}
						// Process data types within this activity folder
						const csvFiles = fs.readdirSync(activityPath)
						.filter(file => file.endsWith(".csv") && isValidInstance(file, 'data_type'));
						console.log(`CSV files in ${activityPath}:`, csvFiles);
						if (Array.isArray(csvFiles)){
							csvFiles.forEach((file) => {
								const fileInstance = {
								name: file.replace(".csv", ""),
								}
								trial.children.push(fileInstance);
							});
						}
						//							trial.children = csvFiles.map((file) => file.replace(".csv", ""));
						if (trial.children.length > 0) activity.children.push(trial);
					});
					if (activity.children.length > 0) userInstance.children.push(activity);
				});
				if (userInstance.children.length > 0) user.children.push(userInstance);
			});
			if (user.children.length > 0) tree.push(user);
		});
		return tree;
    }
	else if (startingClassName === 'activity'){
		INSTANCE_NAMES[startingClassName].forEach((specificActivityName) => {
			const activity = {
				name : specificActivityName,
				children : [],
//				users : [],
			}
			// Loop through user folders
			const userGroups = getGroupedFolders(rootFolder, 'user');
			Object.entries(userGroups).forEach(([userInstanceName, userFolders]) => {
				// Create the user
				const user = {
					name : userInstanceName,
					children : [],
//					userNo : []
				}
				userFolders.forEach(userFolder => {
					console.log(`Processing user folder: ${userFolder}`);
					const userPath = path.join(rootFolder, userFolder);
					// Create the user instance
					const userInstance = {
					    name: userFolder.split("_")[1], // Extract user number (e.g., "01")
					    children: [],
//					    trialNo: [],
					}
					// Process activities within this user folder
					const activityGroups = getGroupedFolders(userPath, 'activity');
					Object.entries(activityGroups)
					.filter( ([activityInstanceName, activityFolders]) =>
							specificActivityName ? activityInstanceName === specificActivityName : true)
					.forEach( ([activityInstanceName, activityFolders]) => {
						activityFolders.forEach(activityFolder => {
							console.log(`Processing activity folder: ${activityFolder}`);
							const activityPath = path.join(userPath, activityFolder);
							const trial = {
							    name: activityFolder.split("_").pop(), // Extract activity trial number (e.g., "01")
							    children: [],
//							    files: [],
							}
							// Process data types within this activity folder
							const csvFiles = fs.readdirSync(activityPath)
							.filter(file => file.endsWith(".csv") && isValidInstance(file, 'data_type'));
							console.log(`CSV files in ${activityPath}:`, csvFiles);
							if (Array.isArray(csvFiles)){
								csvFiles.forEach((file) => {
									const fileInstance = {
									name: file.replace(".csv", ""),
									}
									trial.children.push(fileInstance);
								});
							}
//							trial.children = csvFiles.map((file) => file.replace(".csv", ""));
							if (trial.children.length > 0) userInstance.children.push(trial);
						});
						
					});
					if (userInstance.children.length > 0) user.children.push(userInstance);
				});
				if (user.children.length > 0) activity.children.push(user);
			});
			if (activity.children.length > 0) tree.push(activity);
		});
		return tree;
	}
}


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
	
//	console.log(`[Backend] Markdown content for level ${level}:\n`, markdown);
	return markdown;
}

function saveMarkdownFile(markdownContent, fileName) {
	// Define the file path in the 'public' directory
	const filePath = path.join(__dirname, 'public', `${fileName}.md`);
	
	try {
		// Write the content to the file
		fs.writeFileSync(filePath, markdownContent, 'utf8');
		console.log(`[Backend] Markdown file created at: ${filePath}`);
	} catch (error) {
		console.error(`[Backend] Failed to save markdown file:`, error);
		throw error; // Error re-thrown to get()
	}
}


app.get("/get-tree", (req, res) => {
	const startingClassName = req.query.startingClassName || 'user';
	
	if (!startingClassName || !["user", "activity"].includes(startingClassName)) {
		return res
		.status(400)
		.send("Invalid or missing parameter: 'startingClassName' must be 'user' or 'activity'.");
	}
	
	try {
		console.log(`[Backend] Received startingClassName: ${startingClassName}`);
		// Specify the starting folder
		const rootFolder = path.resolve("data_collection");
		console.log(`[Backend] Resolving root folder: ${rootFolder}`);
		
		// Generate tree
		const tree = buildTree(rootFolder, startingClassName);
		console.log(`[Backend] Generated tree:`);
		console.dir(tree, { depth: null }); // Log the tree object in detail
		
		// Convert tree to markdown file
		const markdownContent = '# Data Collection\n' + treeToMarkdown(tree);
		console.log(`[Backend] Generated markdown tree:`);
		console.log(markdownContent); // Log the markdown tree
		
		// Save the markdown content into a file
		try {
			saveMarkdownFile(markdownContent, 'data_collection_tree');
		}
		catch (fileError){
			return res.status(500).send("Failed to save the Markdown file.");
		}
		
		// Return JSON response
		res.json(tree);
	} catch (error) {
		console.error("Error generating tree:", error);
		res.status(500).send("An error occurred while generating the tree.");
	}
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

