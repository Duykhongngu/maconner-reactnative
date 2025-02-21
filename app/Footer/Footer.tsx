import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Pressable,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Facebook,
  FacebookIcon,
  Globe2,
  Globe2Icon,
  Instagram,
  MessageCircleHeart,
  Twitch,
  TwitchIcon,
  Twitter,
} from "lucide-react-native";

// Define your data structures
const shopByProduct = [
  { name: "Drinkware", href: "/product/drinkware" },
  { name: "Home Décor", href: "/product/home-decor" },
  { name: "Leather Gifts", href: "/product/leather-gifts" },
  { name: "Clothing & Accessories", href: "/product/clothing" },
  { name: "Bedding", href: "/product/bedding" },
  { name: "Photo Gifts", href: "/product/photo-gifts" },
  { name: "Gift Cards", href: "/product/gift-cards" },
];

const shopByOccasion = [
  { name: "Christmas", href: "/occasion/christmas" },
  { name: "Birthday", href: "/occasion/birthday" },
  { name: "Thank You", href: "/occasion/thank-you" },
  { name: "Just Because", href: "/occasion/just-because" },
  { name: "Memorial For Loved Ones", href: "/occasion/memorial" },
  { name: "Pet Memorial", href: "/occasion/pet-memorial" },
  { name: "Anniversary", href: "/occasion/anniversary" },
  { name: "Halloween", href: "/occasion/halloween" },
  { name: "Back to School", href: "/occasion/back-to-school" },
  { name: "Easter", href: "/occasion/easter" },
  { name: "Graduation", href: "/occasion/graduation" },
  { name: "Father's Day", href: "/occasion/fathers-day" },
  { name: "Mother's Day", href: "/occasion/mothers-day" },
  { name: "Valentine's Day", href: "/occasion/valentines-day" },
  { name: "Wedding and Engagement", href: "/occasion/wedding" },
];

const paymentMethods = [
  { name: "DMCA", image: require("~/assets/images/dmca_protected_1_120.png") },
  { name: "Amazon", image: require("~/assets/images/amazon.png") },
  { name: "American Express", image: require("~/assets/images/footer3.png") },
  { name: "Apple Pay", image: require("~/assets/images/footer4.png") },
  { name: "Diners Club", image: require("~/assets/images/footer5.png") },
  { name: "Discover", image: require("~/assets/images/footer6.png") },
  { name: "Google Pay", image: require("~/assets/images/footer7.png") },
  { name: "Mastercard", image: require("~/assets/images/footer8.png") },
  { name: "PayPal", image: require("~/assets/images/footer9.png") },
  { name: "Shop Pay", image: require("~/assets/images/footer10.png") },
  { name: "Venmo", image: require("~/assets/images/footer11.png") },
  { name: "Visa", image: require("~/assets/images/footer12.png") },
];

const Footer: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.newsletterSection}>
        <Text style={styles.newsletterTitle}>
          Today Only: Secret privileges for you!
        </Text>
        <View style={styles.form}>
          <Input
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Button style={styles.button}>
            <Text style={styles.buttonText}>Reveal Now</Text>
          </Button>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Gift Finder</Text>
          <TouchableOpacity onPress={() => toggleSection("product")}>
            <Text style={styles.Trigger}>Shop By Product</Text>
          </TouchableOpacity>
          {expandedSection === "product" && (
            <View>
              {shopByProduct.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleLinkPress(item.href)}
                >
                  <Text style={styles.link}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => toggleSection("occasion")}>
            <Text style={styles.Trigger}>Shop By Occasion</Text>
          </TouchableOpacity>
          {expandedSection === "occasion" && (
            <View>
              {shopByOccasion.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleLinkPress(item.href)}
                >
                  <Text style={styles.link}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Macorner</Text>
          <TouchableOpacity onPress={() => handleLinkPress("/about")}>
            <Text style={styles.link}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/privacy")}>
            <Text style={styles.link}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Help and Support</Text>
          <TouchableOpacity onPress={() => handleLinkPress("/returns")}>
            <Text style={styles.link}>Return Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/help")}>
            <Text style={styles.link}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/size-chart")}>
            <Text style={styles.link}>Size Chart</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/shipping")}>
            <Text style={styles.link}>Shipping And Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/cancellation")}>
            <Text style={styles.link}>Cancellation & Modification Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/refund")}>
            <Text style={styles.link}>Refund & Replacement Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress("/disclaimer")}>
            <Text style={styles.link}>Disclaimer Regarding Fake Websites</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.columnGetInTouch}>
          <Text style={styles.columnTitle}>GET IN TOUCH</Text>
          <Text style={styles.supportTime}>
            Support Time: 9 AM to 5 PM, Mon-Sat
          </Text>
          <Button style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Open A Support Ticket</Text>
          </Button>
          <View style={styles.socialIcons}>
            <Text style={styles.icon}>
              <FacebookIcon className="text-white" size={24} />
            </Text>

            <Text style={styles.icon}>
              <Instagram size={24} />
            </Text>

            <Text style={styles.icon}>
              <Twitter size={24} />
            </Text>

            <Text style={styles.icon}>
              <MessageCircleHeart size={24} />
            </Text>

            <Text style={styles.icon}>
              <Globe2 size={24} />
            </Text>

            <Text style={styles.icon}>
              <Twitch size={24} />
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <Image
            key={method.name}
            source={method.image}
            style={styles.paymentIcon}
            resizeMode="contain"
          />
        ))}
      </View>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => handleLinkPress("/terms")}>
          <Text style={styles.footerLink}>Terms Of Services</Text>
        </TouchableOpacity>
        <Text style={styles.footerLink}>•</Text>
        <TouchableOpacity onPress={() => handleLinkPress("/privacy")}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.companyInfo}>
        MA Commerce Inc. (trading as Macorner), 8 The Green, Ste A, Dover, DE
        19901
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    width: "100%",
    backgroundColor: "#0B1F38",
  },
  newsletterSection: {
    backgroundColor: "#fff8e6",
    padding: 20,
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  form: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    marginRight: 10,
    height: 44,
  },
  button: {
    backgroundColor: "#fb6718",
    height: 44,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  Trigger: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    backgroundColor: "#0B1F38",
    padding: 20,
    width: "100%",
  },
  column: {
    marginBottom: 20,
  },
  columnGetInTouch: {
    marginBottom: 20,
    alignItems: "center",
  },
  columnTitle: {
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  link: {
    color: "white",
    marginBottom: 5,
    fontSize: 14,
  },
  supportTime: {
    color: "white",
    marginBottom: 10,
    fontSize: 14,
  },
  supportButton: {
    backgroundColor: "#fc6514",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  supportButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  paymentMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "white",
  },
  paymentIcon: {
    width: 40,
    height: 24,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
  },
  footerLink: {
    color: "#666",
    marginHorizontal: 5,
    fontSize: 12,
  },
  companyInfo: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    padding: 10,
  },
  icon: {
    color: "#D1D5DB", // gray-300
  },
});

export default Footer;
