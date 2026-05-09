/**
 * TermandConditionsScreen — alphanomy variant
 * 
 * Replaces the default WebView-based terms screen with hardcoded terms
 * specific to Alphanomy.
 */

import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import useTokens from '../../../src/theme/useTokens';
import Text from '../../default/primitives/Text';

const TERMS_CONTENT = [
    {
        title: "1. Agreement & Acceptance",
        body: "By using the Alphanomy website, mobile application, or any of its services, users agree to abide by all terms and conditions established by Alphanomy. These terms are legally binding for all clients, users, and visitors of the platform."
    },
    {
        title: "2. Eligibility and Service Coverage",
        body: "Users must be at least 18 years old to use the services provided by Alphanomy.\nOur services focus on financial research, stock market insights, and educational recommendations.\nAccess to certain services may require account registration or subscription."
    },
    {
        title: "3. Intellectual Property Rights",
        body: "All content available on the Alphanomy platform, including but not limited to:\n\n• research reports\n• articles\n• graphics\n• data\n• software\n• branding and logos\n\nis the exclusive property of Alphanomy and is protected under applicable intellectual property laws.\n\nUsers may not:\n\n• copy\n• reproduce\n• redistribute\n• publish\n• modify\n• sell\n\nany content without prior written permission from Alphanomy."
    },
    {
        title: "4. Client Obligations and Registration",
        body: "Users agree to:\n\n• provide accurate and complete information during registration\n• maintain the confidentiality of their login credentials\n• ensure that their account is not accessed by unauthorized individuals\n\nAlphanomy will not be responsible for any loss or damage arising from unauthorized account usage."
    },
    {
        title: "5. Payment Terms & Refund Policy",
        body: "Users agree to pay the fees specified at the time of purchasing services.\nPayments made for services are subject to the terms outlined during purchase.\nRefunds may be provided on a pro-rata basis for unused services, subject to internal review.\nServices already utilized or consumed are non-refundable."
    },
    {
        title: "6. Research Service Terms and Conditions",
        body: "Alphanomy aims to provide reliable and high-quality financial research reports and insights for its registered users.\n\nIndependent Opinions\nAll views and opinions expressed in reports reflect the independent analysis of the respective analysts regarding the securities or markets discussed.\n\nAnalyst Compensation\nAnalysts are not compensated based on the recommendations or opinions expressed in research reports.\n\nBasis of Recommendations\nRecommendations are based on publicly available information that we believe to be reliable at the time of publication.\n\nInvestment Horizon\nUnless specified otherwise, recommendations may assume an investment horizon of approximately 12 months.\n\nInterpretation of Ratings\nRatings or opinions provided in research reports are based on expected absolute returns, which may be positive or negative.\n\nMarket Fluctuations\nFinancial markets are inherently volatile, and prices of securities may fluctuate due to various market factors, economic events, or company-specific developments.\n\nRating Revisions\nAlphanomy reserves the right to revise, update, or withdraw recommendations if market conditions or analysis change.\n\nChange of Opinions\nOpinions expressed in research reports may change without prior notice.\n\nMarket Risks\nUsers are encouraged to carefully evaluate market risks, including the potential loss of invested capital.\n\nThird-Party Research\nIf third-party research is referenced, we aim to ensure that such information does not contain misleading statements or material inaccuracies."
    },
    {
        title: "7. No Profit Guarantee & Risk Disclaimer",
        body: "All research, analysis, and recommendations provided by Alphanomy are intended for informational and educational purposes only.\n\nWe do not guarantee profits or investment outcomes.\n\nUsers acknowledge that:\n\n• financial markets involve significant risk\n• investments may result in partial or complete loss of capital\n• all decisions are made at the user's own discretion\n\nAlphanomy shall not be held liable for any financial losses, damages, or consequences resulting from the use of our services."
    },
    {
        title: "8. Regulatory Disclaimer",
        body: "Users must review and accept all associated documents including:\n\n• risk disclosures\n• refund policies\n• client consent forms\n• investor charter\n• regulatory disclosures\n\nbefore acting on any financial research or recommendation.\n\nThese requirements align with applicable financial regulations intended to protect investors.\n\nAny discrepancies in identity verification, regulatory compliance, or KYC verification may lead to immediate suspension or termination of services without prior notice."
    },
    {
        title: "9. Limitation of Liability",
        body: "To the fullest extent permitted by law, Alphanomy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, or financial losses arising from the use of the platform or services."
    },
    {
        title: "10. Changes to Terms",
        body: "Alphanomy reserves the right to update or modify these Terms & Conditions at any time. Any updates will be posted on this page with the revised effective date.\n\nContinued use of the platform after changes implies acceptance of the updated terms."
    },
    {
        title: "11. Contact Information",
        body: "If you have any questions regarding these Terms & Conditions, please contact:\n\nEmail: support@alphanomy.com"
    }
];

const TermandConditionsScreen = ({ viewModel, actions }) => {
    const tokens = useTokens();
    const {
        gradient = {},
        mainColor,
    } = viewModel || {};
    const {
        onGoBack = () => {},
    } = actions || {};

    const resolvedMainColor = mainColor || tokens.colors.brand.primary;

    return (
        <View style={styles.root}>
            {/* Header */}
            <LinearGradient
                colors={[
                    gradient.start || tokens.colors.brand.gradientStart,
                    gradient.end || tokens.colors.brand.gradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerContainer}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onGoBack}
                    >
                        <ChevronLeft size={24} color={resolvedMainColor} />
                    </TouchableOpacity>
                    <Text
                        variant="title"
                        style={styles.headerTitle}
                    >
                        Terms & Conditions
                    </Text>
                </View>
            </LinearGradient>

            {/* Static Content */}
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                {TERMS_CONTENT.map((section, index) => (
                    <View key={index} style={styles.sectionContainer}>
                        <Text variant="subtitle" style={[styles.sectionTitle, { color: resolvedMainColor }]}>
                            {section.title}
                        </Text>
                        <Text variant="body" style={styles.sectionBody}>
                            {section.body}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    headerContainer: {
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'Poppins-SemiBold',
        color: '#fff',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 24,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 10,
    },
    sectionBody: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#444',
        lineHeight: 22,
    },
});

export default TermandConditionsScreen;
