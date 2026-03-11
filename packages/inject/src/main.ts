declare const dzPlayer: any;

declare global {
	interface Window {
		DeezifyAPI: typeof DeezifyAPI;
	}
}

const DeezifyAPI = {
	Player: {
		play: () => dzPlayer.control.play(),
		pause: () => dzPlayer.control.pause(),
		isPlaying: () => dzPlayer.isPlaying(),
		getTrack: () => ({
			id: dzPlayer.getSongId(),
			title: dzPlayer.getSongTitle(),
			artist: dzPlayer.getArtistName(),
			album: dzPlayer.getAlbumTitle(),
			cover: dzPlayer.getCover(),
			duration: dzPlayer.getDuration(),
		}),
		getPosition: () => dzPlayer.getPosition(),
	},
	Queue: {
		getList: () => dzPlayer.getTrackList(),
		addNext: (tracks: any) => dzPlayer.addNextTracks(tracks),
		enqueue: (tracks: any) => dzPlayer.enqueueTracks(tracks),
	},
};

window.DeezifyAPI = DeezifyAPI;
