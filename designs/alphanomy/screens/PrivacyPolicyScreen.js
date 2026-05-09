/**
 * PrivacyPolicyScreen — alphanomy variant
 * 
 * Replaces the default WebView-based privacy policy screen with hardcoded 
 * text specific to Alphanomy.
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

const PRIVACY_CONTENT = [
    {
        title: "1. Information We Collect",
        body: "1.1 Personal Information\nWe may collect personal information that you provide directly to us, such as your name, email address, phone number, financial information, and other details necessary for you to use our Service.\n\n1.2 Usage Data\nWe automatically collect information about your interactions with the Service, including IP addresses, browser types, operating systems, pages visited, and the time spent on the Service. This data helps us understand how users engage with our Service and improve its performance.\n\n1.3 Cookies and Tracking Technologies\nWe use cookies and similar tracking technologies to enhance your experience on our Service. Cookies are small files stored on your device that help us remember your preferences and provide a more personalized experience. You can control cookies through your browser settings, but disabling cookies may affect the functionality of the Service."
    },
    {
        title: "2. How We Use Your Information",
        body: "2.1 To Provide and Improve the Service\nWe use your information to deliver, maintain, and improve the Service. This includes processing your requests, sending you updates, and ensuring that the Service operates smoothly.\n\n2.2 To Communicate with You\nWe may use your contact information to communicate with you about your account, respond to your inquiries, and provide important information regarding the Service.\n\n2.3 For Analytics and Research\nWe use aggregated and anonymized data to analyze usage patterns and improve the Service. This helps us understand user behavior and make data-driven decisions.\n\n2.4 For Marketing and Promotional Purposes\nWith your consent, we may use your information to send you promotional materials and updates about our products and services. You can opt out of receiving these communications at any time by following the unsubscribe instructions provided in those communications."
    },
    {
        title: "3. How We Share Your Information",
        body: "3.1 Service Providers\nWe may share your information with third-party service providers who assist us in operating the Service, such as hosting providers, payment processors, and email service providers. These third parties are contractually obligated to protect your information and use it only for the purposes for which it was shared.\n\n3.2 Legal Requirements\nWe may disclose your information if required to do so by law or in response to valid requests by public authorities, such as for legal proceedings, regulatory requirements, or to protect our rights, property, or safety.\n\n3.3 Business Transfers\nIn the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction. We will notify users if such a transfer occurs."
    },
    {
        title: "4. Data Security",
        body: "4.1 Protection Measures\nWe implement reasonable security measures to protect your information from unauthorized access, use, or disclosure. These measures include encryption, secure servers, and access controls.\n\n4.2 Limitations\nDespite our efforts, no security system is completely secure. We cannot guarantee the security of your information transmitted to or from our Service."
    },
    {
        title: "5. Your Rights and Choices",
        body: "5.1 Access and Correction\nYou have the right to access and update your personal information. If you need to correct or update your information, please contact us at support@alphanomy.com\n\n5.2 Data Deletion\nYou may request the deletion of your personal information. We will process such requests in accordance with applicable laws and regulations.\n\n5.3 Opt-Out\nYou can opt out of receiving marketing communications from us by following the unsubscribe instructions in those communications or by contacting us directly."
    },
    {
        title: "Data Retention",
        body: "We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer required, we securely delete or anonymize it."
    },
    {
        title: "Third-Party Links",
        body: "Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage users to review the privacy policies of any third-party services they visit."
    },
    {
        title: "Children's Privacy",
        body: "Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that personal data from a child has been collected without parental consent, we will take steps to delete that information."
    },
    {
        title: "International Transfers",
        body: "If you are accessing the Service from outside India, please note that your information may be transferred to and processed in India or other countries where our service providers operate."
    },
    {
        title: "Changes to This Privacy Policy",
        body: "We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated effective date. We encourage users to review this policy regularly."
    },
    {
        title: "Contact Us",
        body: "If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at:\n\nsupport@alphanomy.com"
    },
    {
        title: "Limitation of Liability",
        body: "To the fullest extent permitted by law, Alphanomy will not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses arising from the use of our Service or handling of personal information."
    }
];

const PrivacyPolicyScreen = ({ viewModel, actions }) => {
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
                        Privacy Policy
                    </Text>
                </View>
            </LinearGradient>

            {/* Static Content */}
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                {PRIVACY_CONTENT.map((section, index) => (
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

export default PrivacyPolicyScreen;
