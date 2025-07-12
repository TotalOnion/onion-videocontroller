const enableDebugLogs = false;

export function generateModal(videoObject) {
	const { videocontainer, elementType } = videoObject;
	let videoElementType = "";
	switch (videoObject.videotype) {
		case "upload":
			videoElementType = "video";
			break;
		case "youtube":
			videoElementType = "iframe";
			break;
		case "vimeo":
			videoElementType = "iframe";
			break;

		default:
			break;
	}
	let modalVideoElement = document.createElement(videoElementType);
	if (videocontainer) {
		let videoPlayer = videocontainer.querySelector(elementType);
		modalVideoElement = videoPlayer.cloneNode();
	}
	const modalContainer = document.createElement("div");
	const modalInner = document.createElement("div");
	const modalClose = document.createElement("button");
	modalClose.addEventListener("click", () => {
		stopVideos(videoObject, true);
	});
	modalVideoElement.classList.add("cblvc-modal-container__video-player");
	modalContainer.classList.add("cblvc-modal-container");
	modalInner.classList.add("cblvc-modal-container__modal-inner");
	modalClose.classList.add("cblvc-modal-container__modal-close");
	modalInner.appendChild(modalVideoElement);
	modalInner.appendChild(modalClose);
	modalContainer.appendChild(modalInner);
	document.body.appendChild(modalContainer);
	videoObject.modalcontainer = modalContainer;
}

export function destroyModal(videoObject) {
	const { modalcontainer } = videoObject;
	modalcontainer.remove();
}

export function isWpAdmin() {
	return document.body.classList.contains("wp-admin") ? true : false;
}

export function revealVideoElement(videoObject) {
	const {
		videocontainer,
		modal,
		modalcontainer,
		videoid,
		isAdmin,
		parentcontainer,
	} = videoObject;
	if (modal && !isAdmin) {
		document.documentElement.classList.add("modal-video-playing");
		addTriggerClass(videoid, "video-playing");
		modalcontainer.classList.add("video-playing");
	} else {
		document.body.classList.add("video-playing");
		addTriggerClass(videoid, "video-playing");
		if (parentcontainer) {
			parentcontainer.classList.add("video-playing");
		}
		videocontainer.classList.add("video-playing");
	}
}

export function hideVideoElement(videoObject) {
	const {
		videocontainer,
		modal,
		modalcontainer,
		isAdmin,
		parentcontainer,
		videoid,
	} = videoObject;
	if (modal && !isAdmin) {
		document.documentElement.classList.remove("modal-video-playing");
		modalcontainer.classList.remove("video-playing");
		setTimeout(() => {
			modalcontainer.remove();
		}, 1000);
		videoObject.youtubeplayer = false;
		removeTriggerClass(videoid, "video-playing");
	} else {
		document.body.classList.remove("video-playing");
		if (parentcontainer) {
			parentcontainer.classList.remove("video-playing");
		}
		videocontainer.classList.remove("video-playing");
		removeTriggerClass(videoid, "video-playing");
	}
}
export function stopVideos(videoObject, stopEverything = false) {
	const { videoid, instance } = videoObject;
	enableDebugLogs && console.log("stopping all vids", stopEverything);
	if (videoObject.modal && videoObject.modalcontainer && stopEverything) {
		hideVideoElement(videoObject);
		return;
	}
	if (!instance.containerCollection) {
		return;
	}
	const keys = Object.keys(instance.containerCollection);
	keys.forEach((key) => {
		const collectionObject = instance.containerCollection[key];
		if (
			stopEverything ||
			(collectionObject.videoid !== videoid && !collectionObject.autoplay)
		) {
			switch (collectionObject.videotype) {
				case "upload":
					collectionObject.videocontainer.querySelector("video").pause();
					break;
				case "youtube":
					if (collectionObject.youtubeplayer) {
						collectionObject.youtubeplayer.pauseVideo();
					}
					break;
				case "vimeo":
					if (collectionObject.vimeoplayer) {
						collectionObject.vimeoplayer.pause();
					}
					break;
				default:
					break;
			}
		}
	});
}

export function removeTriggerClass(triggerid, classname) {
	document
		.querySelectorAll(`[data-triggerid="${triggerid}"]`)
		.forEach((trigger) => {
			trigger.classList.remove(classname);
		});
}
export function addTriggerClass(triggerid, classname) {
	document
		.querySelectorAll(`[data-triggerid="${triggerid}"]`)
		.forEach((trigger) => {
			trigger.classList.add(classname);
		});
}
export function addPlayingStateClasses(elements, classname) {
	elements.forEach((element) => {
		element.classList.add(classname);
	});
}
export function removePlayingStateClasses(elements, classname) {
	elements.forEach((element) => {
		element.classList.add(classname);
	});
}

/**
 * Function for adding a link tag with preconnect to the head of the document. Very useful if you need to add this dynamically.
 * @param {string} domain The domain you wish to preconnect to.
 * @returns {void} The preconnect will be appended to the head tag.
 */
export function appendPreconnect(domain) {
	try {
		if (!domain) {
			console.log("The domain was missing or broken...");
			return;
		}
		const link = document.createElement("link");
		link.rel = "preconnect";
		link.href = domain;
		document.head.appendChild(link);
		return;
	} catch (error) {
		console.error(error);
	}
}

/**
 * Run a function after a window resize event, but only after the alloted time has ended.
 * If another resize even occurs it resets the time window.
 * @param {function} debouncedFunction The function you want to run after a window resize event.
 * @param {number} time The time in ms.
 */
export function resizeDebouncer(debouncedFunction, time = 250) {
	let resizeTimer;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			debouncedFunction();
		}, time);
	});
}
