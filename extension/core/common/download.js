/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global browser, infobar, protobuf */

const MAX_CONTENT_SIZE = 8 * (1024 * 1024);

export {
	downloadPage
};

async function downloadPage(pageData, options) {
	if (options.includeInfobar) {
		await infobar.includeScript(pageData);
	}
	if (options.includeBOM) {
		pageData.content = "\ufeff" + pageData.content;
	}
	const content = Array.from(protobuf.roots.default.Page.encode(pageData).finish());
	for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < content.length; blockIndex++) {
		const message = {
			method: "downloads.download",
			taskId: options.taskId,
			insertTextBody: options.insertTextBody,
			confirmFilename: options.confirmFilename,
			filenameConflictAction: options.filenameConflictAction,
			filename: pageData.filename,
			saveToGDrive: options.saveToGDrive,
			saveToGitHub: options.saveToGitHub,
			githubToken: options.githubToken,
			githubUser: options.githubUser,
			githubRepository: options.githubRepository,
			githubBranch: options.githubBranch,
			forceWebAuthFlow: options.forceWebAuthFlow,
			extractAuthCode: options.extractAuthCode,
			filenameReplacementCharacter: options.filenameReplacementCharacter,
			compressHTML: options.compressHTML,
			backgroundSave: options.backgroundSave,
			bookmarkId: options.bookmarkId,
			replaceBookmarkURL: options.replaceBookmarkURL,
			includeInfobar: options.includeInfobar,
			createRootDirectory: options.createRootDirectory,
			selfExtractingArchive: options.selfExtractingArchive,
			insertCanonicalLink: options.insertCanonicalLink,
			insertMetaNoIndex: options.insertMetaNoIndex,
			password: options.password
		};
		message.truncated = content.length > MAX_CONTENT_SIZE;
		if (message.truncated) {
			message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > content.length;
			message.content = content.slice(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
		} else {
			message.content = content;
		}
		await browser.runtime.sendMessage(message);
	}
	if (options.backgroundSave) {
		await browser.runtime.sendMessage({ method: "downloads.end", taskId: options.taskId });
	}
}