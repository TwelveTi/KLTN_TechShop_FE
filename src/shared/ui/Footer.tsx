import { BrandMark } from './BrandMark'
import { Icon } from './Icon'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="ts-footer">
      <div className="ts-footer__container">
        <div className="ts-footer__brand-col">
          <BrandMark size="lg" />
          <p className="ts-footer__tagline">
            Curated laptops, smartphones, and pro accessories engineered for high performance and daily productivity.
          </p>
          <div className="ts-footer__trust-marks">
            <span className="ts-footer__trust-item">
              <Icon name="shield-check" size={16} /> Official Warranty
            </span>
            <span className="ts-footer__trust-item">
              <Icon name="lock" size={16} /> 256-bit SSL Payment
            </span>
          </div>
        </div>

        <div className="ts-footer__nav-grid">
          <div className="ts-footer__nav-group">
            <h4 className="ts-footer__group-title">Shop Departments</h4>
            <ul className="ts-footer__link-list">
              <li><a href="/">High Performance Laptops</a></li>
              <li><a href="/">Smartphones & Tablets</a></li>
              <li><a href="/">Mechanical Keyboards</a></li>
              <li><a href="/">Precision Mice & Audio</a></li>
            </ul>
          </div>

          <div className="ts-footer__nav-group">
            <h4 className="ts-footer__group-title">Customer Support</h4>
            <ul className="ts-footer__link-list">
              <li><a href="/">Order Tracking</a></li>
              <li><a href="/">Shipping & Delivery Policy</a></li>
              <li><a href="/">Returns & Exchanges</a></li>
              <li><a href="/">Warranty Claims</a></li>
            </ul>
          </div>

          <div className="ts-footer__nav-group">
            <h4 className="ts-footer__group-title">TechShop</h4>
            <ul className="ts-footer__link-list">
              <li><a href="/">About TechShop</a></li>
              <li><a href="/">Privacy Policy</a></li>
              <li><a href="/">Terms of Service</a></li>
              <li><a href="/">Contact Support</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ts-footer__bottom">
        <div className="ts-footer__bottom-container">
          <p className="ts-footer__copyright">
            &copy; {currentYear} TechShop Inc. All rights reserved. Designed with TechShop Design System.
          </p>
          <div className="ts-footer__payments">
            <span className="ts-footer__payment-badge">VNPay</span>
            <span className="ts-footer__payment-badge">COD</span>
            <span className="ts-footer__payment-badge">Visa / Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
