import {
	hideVideoElement,
	revealVideoElement,
	generateModal,
	resizeDebouncer,
	stopVideos,
	dataLayerPush,
} from "./vcUtils.mjs";

function uploadedVideoInit(videoObject) {
	const {
		videocontainer,
		globalSettings,
		fullscreen,
		autoplay,
		controls,
		muted,
		loop,
	} = videoObject;
	globalSettings.enableDebugLogs && console.log("running uploaded init");

	const videoPlayer = videocontainer.querySelector(
		".cblvc-video-container__video-player"
	);
	videoObject.elementType = "video";
	if (loop) {
		videoPlayer.setAttribute("loop", true);
	}
	if (controls) {
		videoPlayer.setAttribute("controls", true);
	}
	if (muted) {
		videoPlayer.setAttribute("muted", true);
	}
	if (autoplay) {
		videoPlayer.setAttribute("autoplay", true);
	}

	if (fullscreen) {
		videoPlayer.removeAttribute("playsinline");
	}

	videoPlayer.addEventListener("play", () => {
		videoObject.instance.setVideoReadyState(videoObject, true);
		stopVideos(videoObject);
		revealVideoElement(videoObject, false);
		if (videoObject.dataLayerPush) {
			dataLayerPush({ name: "play", value: "video play" });
		}
	});
	videoPlayer.addEventListener("pause", () => {
		if (videoObject.dataLayerPush) {
			dataLayerPush({ name: "pause", value: "video paused" });
		}
	});

	videoPlayer.addEventListener("ended", () => {
		if (document.fullscreenElement !== null) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
		hideVideoElement(videoObject);
		if (videoObject.dataLayerPush) {
			dataLayerPush({ name: "ended", value: "video ended" });
		}
	});
	if (videoObject.autoplay && videoObject.muted) {
		triggerUploadedVideo(videoObject);
		if (videoObject.dataLayerPush) {
			dataLayerPush({ name: "autoplaying", value: "video autoplay" });
		}
	}
}
function triggerUploadedVideo(videoObject) {
	const { videocontainer, modal, sources, globalSettings, isAdmin } =
		videoObject;
	globalSettings.enableDebugLogs && console.log("triggering upload video");

	if (modal && !isAdmin) {
		console.log("modal video");

		globalSettings.enableDebugLogs && console.log("triggering modal");
		generateModal(videoObject);
		const modalVideoElement = videoObject.modalcontainer.querySelector("video");
		modalVideoElement.addEventListener("play", () => {
			revealVideoElement(videoObject, true);
		});
		modalVideoElement.addEventListener("ended", () => {
			hideVideoElement(videoObject, true);
		});
		let currentSource = setSrc(modalVideoElement, sources, false, videoObject);
		resizeDebouncer(() => {
			currentSource = setSrc(
				modalVideoElement,
				sources,
				currentSource,
				videoObject
			);
		});
		togglePlay(videoObject);
	} else {
		const videoPlayer = videocontainer.querySelector(
			".cblvc-video-container__video-player"
		);
		globalSettings.enableDebugLogs && console.log("triggering inline video");
		let currentSource = setSrc(videoPlayer, sources, false, videoObject);
		resizeDebouncer(() => {
			currentSource = setSrc(videoPlayer, sources, currentSource, videoObject);
		});
		togglePlay(videoObject);
	}
}

function togglePlay(videoObject) {
	const {
		videocontainer,
		fullscreen,
		isAdmin,
		modalcontainer,
		modal,
		globalSettings,
	} = videoObject;
	globalSettings.enableDebugLogs && console.log("running togglePlay");
	let videoPlayer;
	if (modal && !isAdmin) {
		videoPlayer = modalcontainer.querySelector("video");
	} else {
		videoPlayer = videocontainer.querySelector(
			".cblvc-video-container__video-player"
		);
	}
	if (videoPlayer.paused) {
		if (fullscreen && !isAdmin) {
			document.addEventListener("fullscreenchange", () => {
				if (
					document.fullscreenElement !== null &&
					document.fullscreenElement === videoPlayer
				) {
					setTimeout(() => {
						videoPlayer.play();
					}, 500);
				}
			});
			if (videoPlayer.requestFullscreen) {
				videoPlayer.requestFullscreen();
			} else {
				videoPlayer.play();
			}
		} else {
			videoPlayer.play();
		}
	} else {
		videoPlayer.pause();
	}
}

/**
 * Set Source function :
 * this function is important for mobile/desktop responsiveness as it checks whether to
 * switch to the mobile or desktop video src when the page loads or
 * the screen size changes.
 *
 * @param {HTMLElement} player - this is the selected video element
 * @param {Object} sources - the mobile and desktop video source urls
 * @param {string} source - this is the currently playing video source url
 * @param {Object} videoObject - the current video and its various properties
 */
function setSrc(player, sources, source = false, videoObject) {
	const globalSettings = videoObject.instance.getGlobalSettings();
	let newVideoUrl;
	if (window.innerWidth >= globalSettings.srcBreakpoint) {
		newVideoUrl = sources.desktop;
		if (source && source !== newVideoUrl) {
			player.setAttribute("src", newVideoUrl);
		} else if (player.paused) {
			player.setAttribute("src", newVideoUrl);
			player.pause();
		}
	} else {
		newVideoUrl = sources.mobile;
		if (!newVideoUrl) {
			newVideoUrl = sources.desktop;
		}
		if (source && source !== newVideoUrl) {
			player.setAttribute("src", newVideoUrl);
		} else if (player.paused) {
			player.setAttribute("src", newVideoUrl);
			player.pause();
		}
	}
	return newVideoUrl;
}

const api = {
	triggerUploadedVideo,
	uploadedVideoInit,
};

export default api;
