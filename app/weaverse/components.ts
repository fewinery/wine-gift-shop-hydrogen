import type { HydrogenComponent } from "@weaverse/hydrogen";
import * as Heading from "~/components/heading";
import * as Link from "~/components/link";
import * as Paragraph from "~/components/paragraph";
import * as SubHeading from "~/components/subheading";
import * as AllProducts from "~/sections/all-products";
import * as AlternatingContent from "~/sections/alternating-content";
import * as AlternatingContentItem from "~/sections/alternating-content/item";
import * as BlogPost from "~/sections/blog-post";
import * as Blogs from "~/sections/blogs";
import * as BrandShowcase from "~/sections/brand-showcase";
import * as BrandShowcaseItem from "~/sections/brand-showcase/item";
import * as BrandShowcaseTab from "~/sections/brand-showcase/tab";
import * as BrandStory from "~/sections/brand-story";
import * as BrandStoryContent from "~/sections/brand-story/content";
import * as BrandStoryImage from "~/sections/brand-story/image";
import * as ClubComparison from "~/sections/club-comparison";
import * as ClubComparisonItem from "~/sections/club-comparison/item";
import * as CollectionFilters from "~/sections/collection-filters";
import * as CollectionList from "~/sections/collection-list";
import * as CollectionListItems from "~/sections/collection-list/collections-items";
import * as ColumnsWithImages from "~/sections/columns-with-images";
import * as ColumnWithImageItem from "~/sections/columns-with-images/column";
import * as ColumnsWithImagesItems from "~/sections/columns-with-images/items";
import * as ComparisonTable from "~/sections/comparison-table";
import * as ComparisonColumn from "~/sections/comparison-table/column";
import * as ContactForm from "~/sections/contact-form";
import * as Countdown from "~/sections/countdown";
import * as CountDownTimer from "~/sections/countdown/timer";
import * as FaqSection from "~/sections/faq";
import * as FaqItem from "~/sections/faq/item";
import * as FeaturedCollections from "~/sections/featured-collections";
import * as FeaturedCollectionItems from "~/sections/featured-collections/collection-items";
import * as FeaturedProducts from "~/sections/featured-products";
import * as FeaturedProductHeader from "~/sections/featured-products/product-header";
import * as FeaturedProductItems from "~/sections/featured-products/product-items";
import * as FeaturedWineClubs from "~/sections/featured-wine-clubs";
import * as FeaturedWineClubsHeader from "~/sections/featured-wine-clubs/header";
import * as FeaturedWineClubsItems from "~/sections/featured-wine-clubs/items";
import * as HeroImage from "~/sections/hero-image";
import * as HeroVideo from "~/sections/hero-video";
import * as Hotspots from "~/sections/hotspots";
import * as HotspotsItem from "~/sections/hotspots/item";
import * as ImageGallery from "~/sections/image-gallery";
import * as ImageGalleryItem from "~/sections/image-gallery/image";
import * as ImageGalleryItems from "~/sections/image-gallery/items";
import * as ImageWithText from "~/sections/image-with-text";
import * as ImageWithTextButtonsWrapper from "~/sections/image-with-text/buttons-wrapper";
import * as ImageWithTextContent from "~/sections/image-with-text/content";
import * as ImageWithTextImage from "~/sections/image-with-text/image";
import * as JudgemeReview from "~/sections/judgeme-reviews";
import * as JudgemeReviewList from "~/sections/judgeme-reviews/review-list";
import * as JudgemeReviewSummary from "~/sections/judgeme-reviews/review-summary";
import * as MainProduct from "~/sections/main-product";
import * as JudgemeStarsRating from "~/sections/main-product/judgeme-stars-rating";
import * as ProductATCButtons from "~/sections/main-product/product-atc-buttons";
import * as ProductBadges from "~/sections/main-product/product-badges";
import * as ProductBreadcrumb from "~/sections/main-product/product-breadcrumb";
import * as ProductBundledVariants from "~/sections/main-product/product-bundled-variants";
import * as ProductCollapsibleDetails from "~/sections/main-product/product-collapsible-details";
import * as ProductPrices from "~/sections/main-product/product-prices";
import * as ProductQuantitySelector from "~/sections/main-product/product-quantity-selector";
import * as ProductSummary from "~/sections/main-product/product-summary";
import * as ProductTitle from "~/sections/main-product/product-title";
import * as ProductVariantSelector from "~/sections/main-product/product-variant-selector";
import * as ProductVendor from "~/sections/main-product/product-vendor";
import * as MapSection from "~/sections/map";
import * as NewsLetter from "~/sections/newsletter";
import * as NewsLetterForm from "~/sections/newsletter/newsletter-form";
import * as OurTeam from "~/sections/our-team";
import * as OurTeamMembers from "~/sections/our-team/team-members";
import * as Page from "~/sections/page";
import * as PromotionGrid from "~/sections/promotion-grid";
import * as PromotionGridButtons from "~/sections/promotion-grid/buttons";
import * as PromotionGridItem from "~/sections/promotion-grid/item";
import * as QuoteCarousel from "~/sections/quote-carousel";
import * as QuoteCarouselItem from "~/sections/quote-carousel/item";
import * as RelatedArticles from "~/sections/related-articles";
import * as RelatedProducts from "~/sections/related-products";
import * as ReservationForm from "~/sections/reservation-form";
import * as ShopByCategory from "~/sections/shop-by-category";
import * as ShopByCategoryItems from "~/sections/shop-by-category/items";
import * as SingleProduct from "~/sections/single-product";
import * as SlideShow from "~/sections/slideshow";
import * as SlideShowSlide from "~/sections/slideshow/slide";
import * as Spacer from "~/sections/spacer";
import * as StepsGuide from "~/sections/steps-guide";
import * as StepsGuideItem from "~/sections/steps-guide/step";
import * as Testimonials from "~/sections/testimonials";
import * as TestimonialItem from "~/sections/testimonials/item";
import * as TierMembership from "~/sections/tier-membership";
import * as TierMembershipItem from "~/sections/tier-membership/item";
import * as VideoEmbed from "~/sections/video-embed";
import * as VideoEmbedItem from "~/sections/video-embed/video";
import * as WineClubItem from "~/sections/wine-clubs/wine-club-item";
import * as WineClubSelectionWizard from "~/sections/wine-clubs/wine-club-selection-wizard";
import * as WineClubsSection from "~/sections/wine-clubs/wine-clubs-section";

export const components: HydrogenComponent[] = [
  SubHeading,
  Heading,
  Paragraph,
  Link,
  // AliReview,
  // AliReviewList,
  AllProducts,
  FeaturedCollections,
  FeaturedCollectionItems,
  BlogPost,
  Blogs,
  Page,
  VideoEmbed,
  VideoEmbedItem,
  HeroImage,
  BrandStory,
  BrandStoryImage,
  BrandStoryContent,
  ImageWithText,
  ImageWithTextContent,
  ImageWithTextImage,
  ImageWithTextButtonsWrapper,
  ColumnsWithImages,
  ColumnsWithImagesItems,
  ColumnWithImageItem,
  HeroVideo,
  MapSection,
  PromotionGrid,
  PromotionGridItem,
  PromotionGridButtons,
  Hotspots,
  HotspotsItem,
  StepsGuide,
  StepsGuideItem,
  Countdown,
  CountDownTimer,
  NewsLetter,
  NewsLetterForm,
  Blogs,
  BlogPost,
  AllProducts,
  FeaturedProducts,
  FeaturedProductItems,
  FeaturedProductHeader,
  ImageGallery,
  ImageGalleryItems,
  ImageGalleryItem,
  MainProduct,
  ProductBreadcrumb,
  ProductBadges,
  ProductVendor,
  ProductTitle,
  ProductPrices,
  ProductSummary,
  ProductBundledVariants,
  ProductVariantSelector,
  ProductQuantitySelector,
  ProductATCButtons,
  ProductCollapsibleDetails,
  RelatedProducts,
  RelatedArticles,
  CollectionFilters,
  CollectionList,
  CollectionListItems,
  SingleProduct,
  JudgemeStarsRating,
  JudgemeReview,
  JudgemeReviewSummary,
  JudgemeReviewList,
  OurTeam,
  OurTeamMembers,
  SlideShow,
  SlideShowSlide,
  Spacer,
  WineClubsSection,
  WineClubItem,
  WineClubSelectionWizard,
  FeaturedWineClubs,
  FeaturedWineClubsHeader,
  FeaturedWineClubsItems,
  FaqSection,
  FaqItem,
  ComparisonTable,
  ComparisonColumn,
  AlternatingContent,
  AlternatingContentItem,
  QuoteCarousel,
  QuoteCarouselItem,
  TierMembership,
  TierMembershipItem,
  ClubComparison,
  ClubComparisonItem,
  Testimonials,
  TestimonialItem,
  ReservationForm,
  BrandShowcase,
  BrandShowcaseTab,
  BrandShowcaseItem,
  ShopByCategory,
  ShopByCategoryItems,
  ContactForm,
];
