import {
  MEDIA_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
} from "~/graphql/fragments";

export const PRODUCT_QUERY = `#graphql
  query product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      vendor
      handle
      publishedAt
      description
      summary: description
      descriptionHtml
      encodedVariantExistence
      encodedVariantAvailability
      tags
      featuredImage {
        id
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      badges: metafields(identifiers: [
        { namespace: "custom", key: "best_seller" }
      ]) {
        key
        namespace
        value
      }
      accolades: metafield(namespace: "custom", key: "accolades") {
        references(first: 20) {
          nodes {
            ... on Metaobject {
              id
              handle
              type
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
      wineSpecs: metafield(namespace: "custom", key: "wine_specs") {
        value
      }
      tastingNotes: metafield(namespace: "custom", key: "tasting_notes") {
        value
      }
      foodPairings: metafield(namespace: "custom", key: "food_pairings") {
        value
      }
      recipe: metafield(namespace: "custom", key: "recipe") {
        value
      }
      downloadVineAndDineRecipe: metafield(
        namespace: "custom"
        key: "download_vine_and_dine_recipe"
      ) {
        reference {
          ... on Metaobject {
            id
            handle
            type
            fields {
              key
              value
              reference {
                ... on MediaImage {
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
                ... on GenericFile {
                  url
                }
              }
            }
          }
        }
      }

      upsellConfiguration: metafield(
        namespace: "custom"
        key: "upsell_configuration"
      ) {
        reference {
          ... on Metaobject {
            id
            handle
            type
            fields {
              key
              value
              references(first: 50) {
                nodes {
                  ... on Product {
                    id
                    title
                    handle
                    featuredImage {
                      id
                      url
                      altText
                    }
                    variants(first: 1) {
                      nodes {
                        id
                        title
                        availableForSale
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      goesWellWith: metafield(namespace: "custom", key: "goes_well_with") {
        references(first: 10) {
          nodes {
            ... on Product {
              ...ProductCard
            }
          }
        }
      }
      options {
        ...ProductOption
      }
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...ProductVariant
      }
      adjacentVariants(selectedOptions: $selectedOptions) {
        ...ProductVariant
      }
      # Check if the product is a bundle
      isBundle: selectedOrFirstAvailableVariant(ignoreUnknownOptions: true, selectedOptions: { name: "", value: ""}) {
        ...on ProductVariant {
          requiresComponents
          components(first: 100) {
             nodes {
                productVariant {
                  ...ProductVariant
                }
                quantity
             }
          }
          groupedBy(first: 100) {
            nodes {
                id
              }
            }
          }
      }
      media(first: 50) {
        nodes {
          ...Media
        }
      }
      seo {
        description
        title
      }
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
` as const;
