import {
	generateModal,
	stopVideos,
	revealVideoElement,
	hideVideoElement,
	dataLayerPush,
} from "./vcUtils.mjs";

const players = new Map();

function youtubeInit(videoObject) {
	const autoplay = videoObject.autoplay;
	const playerId = `yt-${videoObject.videoid}`;
	videoObject.playerId = playerId;
	if (autoplay) {
		triggerYoutube(videoObject);
	}
}

async function triggerYoutube(videoObject) {
	const { playerId, modal, isAdmin } = videoObject;
	videoObject.elementType = "iframe";

	if (!window.YT) {
		console.log("YT not loaded yet in triggerYoutube");
		await injectYouTubeIframeScript();
		console.log("YT loaded in triggerYoutube");
	}

	if (modal && !isAdmin) {
		generateModal(videoObject);
	}
	if (!players.get(playerId)) {
		initializePlayer(videoObject);
		return;
	}

	const playerData = players.get(playerId);
	if (!playerData) {
		console.error(`no player data found for ${playerId}`);
		return;
	}

	const { player } = playerData;
	if (playerData.initialized) {
		player.playVideo();
	} else {
		console.error(`YouTube player not initialized for ${playerId}`);
	}
}

async function initializePlayer(videoObject) {
	const playerId = videoObject.playerId;
	const player = createYouTubePlayer(videoObject);
	videoObject.youtubeplayer = player;
	players.set(playerId, { initialized: true, player, videoObject });
}

function createYouTubePlayer(videoObject) {
	const playerId = videoObject.playerId;
	const srcDesktop = videoObject.videocontainer.dataset.youtubedesktop;
	const srcMobile = videoObject.videocontainer.dataset.youtubemobile;
	const videoSrc =
		window.innerWidth < videoObject.globalSettings.srcBreakpoint && srcMobile
			? srcMobile
			: srcDesktop;

	return new YT.Player(playerId, {
		videoId: videoSrc,
		playerVars: {
			autoplay: videoObject.autoplay ? 1 : 0,
			mute: videoObject.muted ? 1 : 0,
			controls: videoObject.controls ? 1 : 0,
			loop: videoObject.loop ? 1 : 0,
		},
		events: {
			onStateChange: (event) => onPlayerStateChange(event, videoObject),
			onReady: (event) => {
				videoObject.instance.setVideoReadyState(videoObject, true);
				event.target.playVideo();
			},
		},
	});
}

function onPlayerStateChange(event, videoObject) {
	const { globalSettings } = videoObject;
	switch (event.data) {
		case YT.PlayerState.PLAYING:
			globalSettings.enableDebugLogs && console.log("Playing the video");
			stopVideos(videoObject);
			revealVideoElement(videoObject);
			if (videoObject.dataLayerPush) {
				dataLayerPush({ eventname: "play", videoObject });
			}
			break;
		case YT.PlayerState.PAUSED:
			globalSettings.enableDebugLogs && console.log("Pausing the video");
			if (videoObject.dataLayerPush) {
				dataLayerPush({ eventname: "pause", videoObject });
			}
			break;

		case YT.PlayerState.ENDED:
			if (videoObject.loop) {
				const player = players.get(videoObject.playerId).player;
				player.playVideo();
				return;
			}
			globalSettings.enableDebugLogs && console.log("Video ended");
			hideVideoElement(videoObject);
			if (videoObject.dataLayerPush) {
				dataLayerPush({ eventname: "ended", videoObject });
			}
			break;
	}
}

/**
 * Injects the youtube iframe api script and waits for the YT object to be instantiated before resolving the promise
 * @returns {promise} Resolves once the YT object is available.
 */
function injectYouTubeIframeScript() {
	const prom = new Promise((resolve) => {
		if (globalThis.YT) {
			return resolve();
		}
		const tag = document.createElement("script");
		tag.id = "iframe-api";
		tag.src = "https://www.youtube.com/iframe_api";

		const firstScriptTag = document.getElementsByTagName("script")[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		tag.addEventListener("load", () => {
			if (!YT.loaded) {
				const loadingCheck = setInterval(() => {
					if (YT.loaded) {
						clearInterval(loadingCheck);
						return resolve(true);
					}
				}, 50);
			} else {
				return resolve(true);
			}
		});
	});

	return prom;
}

const api = {
	youtubeInit,
	triggerYoutube,
};

export default api;
