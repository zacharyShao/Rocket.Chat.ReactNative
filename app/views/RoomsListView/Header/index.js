import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSearch as setSearchAction } from '../../../actions/rooms';
import Header from './Header';

class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		isFetching: PropTypes.bool,
		setSearch: PropTypes.func
	}

	onSearchChangeText = (text) => {
		const { setSearch } = this.props;
		setSearch(text.trim());
	}

	render() {
		const {
			serverName, showSearchHeader, connecting, isFetching
		} = this.props;

		return (
			<Header
				serverName={serverName}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				isFetching={isFetching}
				onSearchChangeText={text => this.onSearchChangeText(text)}
			/>
		);
	}
}

const mapStateToProps = state => ({
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name
});

const mapDispatchtoProps = dispatch => ({
	setSearch: searchText => dispatch(setSearchAction(searchText))
});

export default connect(mapStateToProps, mapDispatchtoProps)(RoomsListHeaderView);
