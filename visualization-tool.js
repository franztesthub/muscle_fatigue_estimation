/*!
 * Author: Franz Chuquirachi
 * Program: visualization-tool.js
 * Date Created: November 29, 2024
 * Copyright (c) 2024, Franz Arthur Chuquirachi Rosales. All rights reserved.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const server = express();
const PORT = 3000;

// Serve static files
server.use(express.static('public'));
console.log(`[Backend] Static files served from /public.`);

// Allowed instances names of each class
const INSTANCE_NAMES = JSON.parse(fs.readFileSync('instanceNames.json', 'utf8'));

/**
 * Validates whether a given folder name starts with any of the registered instance names
 * for a specified class type.
 * @param {string} name - The folder name to validate.
 * @param {string} className - The category of the instance. Must be one of the following:
 *                             - 'user': Represents user-related folders.
 *                             - 'activity': Represents activity-related folders.
 *                             - 'data_type': Represents data type-related files or folders.
 * @returns {boolean} - Returns `true` if the folder name starts with a valid prefix for the
 *                      specified class, or `false` otherwise.
 * @throws {Error} - Throws an error if the provided `className` is invalid (not found in
 *                   `INSTANCE_NAMES`).
*/
function isValidInstance(name, className) {
    if (!INSTANCE_NAMES[className]) {
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
 * Groups directories within a specified folder based on their prefixes, which correspond to
 * the allowed instance names for a given class.
 * @param {string} folderPath - The absolute path of the folder to scan.
 * @param {string} className - The category of the instance. Must be one of the following:
 *                             - 'user': Represents user-related folders.
 *                             - 'activity': Represents activity-related folders.
 *                             - 'data_type': Represents data type-related files or folders.
 * @returns {Object} - An object where each key is a valid instance name (prefix) from
 *                     `INSTANCE_NAMES[className]`, and its value is an array of directory names
 *                     in `folderPath` that start with the corresponding instance name.
 * @throws {Error} - Throws an error if the provided `className` is invalid (not found in
 *                   `INSTANCE_NAMES`).
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
 * Constructs a hierarchical directory tree from a `data_collection` folder.
 * The tree structure varies depending on the specified starting class name (`user` or `activity`).
 *
 * ### Overview
 * - If `startingClassName` is `'user'`:
 *   - Builds the tree starting with user directories, grouping their activities, trials, and associated `.csv` files.
 * - If `startingClassName` is `'activity'`:
 *   - Groups activities as the top-level nodes, linking them to users, their trials, and associated `.csv` files.
 *
 * ### Tree Structure
 * - Each node in the tree is an object containing:
 *   - `name`: Name of the instance or file or the number of the instance.
 *   - `children`: Array of child nodes (if applicable).
 *
 * @param {string} rootFolder - The path to the root folder containing the `data_collection` directory.
 * @param {string} startingClassName - Specifies the top-level hierarchy:
 *                                     - `'user'`: Users are the top-level nodes.
 *                                     - `'activity'`: Activities are the top-level nodes.
 * @returns {Array<Object>} - A hierarchical tree structure representing the directory organization.
 * @throws {Error} - Throws an error if the `startingClassName` is invalid.
 *
 * ### Examples
 * #### Input Directory Structure:
 * ```
 * data_collection/
 * ├── user_01/
 * │   └── walk_01/
 * │   │   ├── acceleration.csv
 * │   │   └── gyroscope.csv
 * │   └── run_01/
 * │       └── acceleration.csv
 * └── user_02/
 * ```
 *
 * #### Usage:
 * ```javascript
 * const tree = buildTree('/path/to/data_collection', 'user');
 * console.log(tree);
 * ```
 * #### Output:
 * ```javascript
 * [
 *   {
 *     name: "user",
 *     children: [
 *       {
 *         name: "01",
 *         children: [
 *           {
 *             name: "walk",
 *             children: [
 *               {
 *                 name: "01",
 *                 children: [
 *                   { name: "acceleration" },
 *                   { name: "gyroscope" }
 *                 ]
 *              }
 *             ]
 *           },
 *           {
 *             name: "run",
 *             children: [
 *               {
 *                 name: "01",
 *                 children: [
 *                   { name: "acceleration" }
 *                 ]
 *               }
 *             ]
 *           },
 *         ]
 *       },
 *       {
 *         name: "02",
 *         children: [
 *           {
 *             name: "walk",
 *             children: [
 *               {
 *                 name: "01",
 *                 children: []
 *               }
 *             ]
 *           },
 *         ]
 *       }
 *     ]
 *   },
 * ]
 * ```
 */
function buildTree(rootFolder, startingClassName) {
    const tree = [];
    
    if (startingClassName === 'user'){
		specificActivityName = null;
		// Process user folders
		const userGroups = getGroupedFolders(rootFolder, 'user');
		Object.entries(userGroups).forEach(([userInstanceName, userFolders]) => {
			const user = {
				name : userInstanceName,
				children : [], // userInstance
			}
			userFolders.forEach(userFolder => {
//				console.log(`Processing user folder: ${userFolder}`);
				const userPath = path.join(rootFolder, userFolder);
				const userInstance = {
				    name: userFolder.split("_")[1], // Extract user number (e.g., "01")
				    children: [], // activity
				}
				// Process activities
				const activityGroups = getGroupedFolders(userPath, 'activity');
				Object.entries(activityGroups)
				.filter(([activityInstanceName, activityFolders]) =>
						specificActivityName ? activityInstanceName === specificActivityName : true
						)
				.forEach(([activityInstanceName, activityFolders]) => {
					const activity = {
						name : activityInstanceName,
						children : [], // trial
					}
					activityFolders.forEach(activityFolder => {
//						console.log(`Processing activity folder: ${activityFolder}`);
						const activityPath = path.join(userPath, activityFolder);
						const trial = {
						    name: activityFolder.split("_").pop(), // Extract activity trial number (e.g., "01")
						    children: [], // fileInstance
						}
						// Process data files
						const csvFiles = fs.readdirSync(activityPath)
						.filter(file => file.endsWith(".csv") && isValidInstance(file, 'data_type'));
//						console.log(`CSV files in ${activityPath}:`, csvFiles);
						if (Array.isArray(csvFiles)){
							csvFiles.forEach((file) => {
								const fileInstance = {
								name: file.replace(".csv", ""),
								}
								trial.children.push(fileInstance);
							});
						}
						//  trial.children = csvFiles.map((file) => file.replace(".csv", ""));
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
			// Create the activity nodes
			const activity = {
				name : specificActivityName,
				children : [], // user
			}
			// Process users
			const userGroups = getGroupedFolders(rootFolder, 'user');
			Object.entries(userGroups).forEach(([userInstanceName, userFolders]) => {
				const user = {
					name : userInstanceName,
					children : [], // userInstance
				}
				userFolders.forEach(userFolder => {
					console.log(`Processing user folder: ${userFolder}`);
					const userPath = path.join(rootFolder, userFolder);
					const userInstance = {
					    name: userFolder.split("_")[1], // Extract user number (e.g., "01")
					    children: [], // trial
					}
					// Process activities
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
							    children: [], // fileInstance
							}
							// Process data files
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
							//	trial.children = csvFiles.map((file) => file.replace(".csv", ""));
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
	
//	console.log(`[Backend] Markdown content for level ${level}:\n`, markdown);
	return markdown;
}

/**
 * Saves a Markdown-formatted string as a file in the 'public' directory.
 *
 * @param {string} markdownContent - The content to save in the Markdown file.
 * @param {string} fileName - The name of the file (without extension) to save.
 * @throws {Error} - Throws an error if the file cannot be written.
 *
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
*/
/**
 * Saves a Markdown file with content and a dynamically generated file name.
 *
 * The file name is constructed with the current date and time, followed by the base name
 * and the provided `startingClassName` at the end.
 *
 * @param {string} markdownContent - The Markdown content to save.
 * @param {string} baseName - The base name of the file (e.g., "data_collection_tree").
 * @param {string} startingClassName - The starting class name to append to the file name (e.g., "user", "activity").
 * @throws {Error} - If there is an issue writing the file.
 */
function saveMarkdownFile(markdownContent, baseName, startingClassName) {
	// Get the current date and time in the desired format
	const now = new Date();
	// Format the date and time manually as YYYYMMDDhhmmss in local timezone
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-based
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0'); // Local hour
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	
	// Construct the timestamp
	const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
	
	// Construct the file name
	const fileName = `${timestamp}_${baseName}_by_${startingClassName}.md`;
	
	// Define the folder path
	const folderPath = path.join(__dirname, 'public', 'tree_history');
	
	// Check if the folder exists and create the folder if it doesn't exist
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
		console.log('[Backend] tree_history folder created');
	}
	
	// Define the file path in the 'public' directory
	const filePath = path.join(folderPath, fileName);
	
	try {
		// Write the content to the file
		fs.writeFileSync(filePath, markdownContent, 'utf8');
		console.log(`[Backend] Markdown file added to history folder at: ${filePath}`);
	} catch (error) {
		console.error(`[Backend] Failed to save markdown file:`, error);
		throw error; // Re-throw the error to the caller
	}
}

/**
 * Handles GET requests to generate a directory tree for the data collection system and return it as JSON.
 * It also generates and saves a Markdown representation of the tree.
 *
 * @route GET /get-tree
 * @query {string} startingClassName - The class name to start tree generation from ('user' or 'activity').
 *                                      Defaults to 'user' if not provided.
 *
 * @returns {Object} - JSON response containing the result of the directory tree generation and Markdown file saving.
 *                     The response object contains two properties:
 *                     - error_msg: A string representing an error message if any error occurred, otherwise null.
 *                     - tree: The generated directory tree as a JSON object, or null if an error occurred.
 *
 * @throws {400} - If `startingClassName` is invalid or missing (not 'user' or 'activity').
 * @throws {500} - If an error occurs during tree generation or file saving.
 *
 * @example
 * // Request:
 * // GET /get-tree?startingClassName=user
 *
 * // Response (JSON) - Successful:
 * {
 *   "error_msg": null,
 *   "tree": {
 *     "name": "User1",
 *     "children": [
 *       {
 *         "name": "Activity1",
 *         "children": [
 *           {
 *             "name": "Trial1",
 *             "children": [
 *               { "name": "File1" }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * // Response (JSON) - Error during file saving:
 * {
 *   "error_msg": "Failed to save the Markdown file.",
 *   "tree": {
 *     "name": "User1",
 *     "children": [
 *       {
 *         "name": "Activity1",
 *         "children": [
 *           {
 *             "name": "Trial1",
 *             "children": [
 *               { "name": "File1" }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * // Response (JSON) - Error during tree generation:
 * {
 *   "error_msg": "An error occurred while generating the tree.",
 *   "tree": null
 * }
 *
 * // Markdown file saved as 'data_collection_tree.md' (if successful):
 * # Data Collection
 * ## User1
 * - Activity1
 *   - Trial1
 *     - File1
 */
server.get("/get-tree", (req, res) => {
	const startingClassName = req.query.startingClassName || 'user';
	
	if (!startingClassName || !["user", "activity"].includes(startingClassName)) {
		// Return JSON response
		return res.status(400).json({
			error_msg: "Invalid or missing parameter: 'startingClassName' must be 'user' or 'activity'.",
			tree: null,
		});
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
			saveMarkdownFile(markdownContent, 'data_collection_tree', startingClassName);
		}
		catch (fileError){
			// Return JSON response
			return res.status(500).json({
				error_msg: "Failed to save the Markdown file.",
				tree: tree,
			});
		}
		
		// Return JSON response
		res.json({
			error_msg: null,
			tree: tree,
		});
	} catch (error) {
		console.error("Error generating tree:", error);
		// Return JSON response
		res.status(500).json({
			error_msg: "An error occurred while generating the tree.",
			tree: null,
		});
	}
});

/**
 * Initializes the server and automatically opens the default web browser to the server's URL.
 *
 * @async
 * @function
 * @throws {Error} - If the `open` module fails to load or the server encounters an error during startup.
 */
(async () => {
	try {
		const open = await import('open'); // Dynamically import the `open` package
		
		server.listen(PORT, () => {
			console.log(`Server running at http://localhost:${PORT}`);
			// Automatically open the browser
			open.default(`http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("Error loading the 'open' module:", error);
	}
})();

