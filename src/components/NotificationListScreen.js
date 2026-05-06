/**
 * NotificationListScreen — container (Phase J follow-up, 2026-05-06)
 *
 * Thin container that resolves the design-system presentation for the
 * Notification list. The legacy chrome (back chevron + title + simple
 * FlatList) is preserved by `designs/default/screens/NotificationListScreen.js`;
 * the alphanomy chrome (HTML § "08 · Notifications") lives at
 * `designs/alphanomy/screens/NotificationListScreen.js`.
 *
 * No real notification feed is wired yet — the alphanomy variant ships a
 * sample list matching the HTML mockup so the design preview renders. When
 * the backend / push notification feed lands, replace `notifications: []`
 * here with the live array (and remove the alphanomy variant's
 * FALLBACK_ITEMS once that's stable).
 */

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useComponent } from '../design/useDesign';

const NotificationListScreen = () => {
    const navigation = useNavigation();
    const Presentation = useComponent('screens.NotificationListScreen');

    const viewModel = {
        notifications: [],
        isLoading: false,
    };
    const actions = {
        onBack: () => navigation.goBack(),
        onMarkAllRead: () => {},
        onNotificationPress: undefined,
    };

    return <Presentation viewModel={viewModel} actions={actions} />;
};

export default NotificationListScreen;
