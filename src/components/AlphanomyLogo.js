/**
 * AlphanomyLogo — brand mark for the alphanomy variant.
 *
 * Renders the finalized gradient "i" mark shipped at
 * `src/assets/AppLogo/alphanomy-logo.png`. Used by splash, login,
 * and `BrandLogo` callsites on the alphanomy fork.
 *
 * Sized via the `size` prop (square). Pass `style` to add positioning,
 * margins, etc.
 */

import React from 'react';
import { Image, StyleSheet } from 'react-native';

const ALPHANOMY_LOGO = require('../assets/AppLogo/alphanomy-logo.png');

const AlphanomyLogo = ({ size = 56, style }) => (
    <Image
        source={ALPHANOMY_LOGO}
        style={[{ width: size, height: size }, style, styles.logo]}
        resizeMode="contain"
    />
);

const styles = StyleSheet.create({
    logo: {
        // resizeMode set via prop; keeps layout-affecting style overridable.
    },
});

export default AlphanomyLogo;
