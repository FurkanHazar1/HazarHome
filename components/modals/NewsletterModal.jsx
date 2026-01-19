"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { toPublicUrl } from "@/lib/image-helpers";

export default function NewsletterModal() {
  const pathname = usePathname();
  const formRef = useRef();
  const [success, setSuccess] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  
  const modalElement = useRef();
  useEffect(() => {
    const showModal = async () => {
      if (pathname === "/") {
        const bootstrap = await import("bootstrap"); // dynamically import bootstrap
        const myModal = new bootstrap.Modal(
          document.getElementById("newsletterPopup"),
          {
            keyboard: false,
          }
        );

        // Show the modal after a delay using a promise
        await new Promise((resolve) => setTimeout(resolve, 2000));
        myModal.show();

        modalElement.current.addEventListener("hidden.bs.modal", () => {
          myModal.hide();
        });
      }
    };

    showModal();
  }, [pathname]);
  return (
    <div
      ref={modalElement}
      className="modal modalCentered fade auto-popup modal-newleter"
      id="newsletterPopup"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-top" style={{ padding: 0 }}>
            <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '8px', background: '#ffffffff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                src={toPublicUrl("videos/hazarhome.mp4")}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: '8px', background: '#e3dedeff' }}
              />
            </div>
            <span
              className="icon icon-close btn-hide-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <div className="modal-bottom">
            <h4 className="text-center">Sosyal Medyadan Bizi Takip Edin</h4>
            <h6 className="text-center">
              Yeni ürünlerden ilk siz haberdar olun.
            </h6>
              
           
                <div className="d-flex justify-content-center">
                  <ul className="tf-social-icon d-flex gap-20 justify-content-center">
                    <li>
                      <a
                        href="https://www.facebook.com/people/Hazar-Home/61577648638207/"
                        className="box-icon square social-facebook social-line newsletter-social-icon"
                        aria-label="Facebook"
                      >
                        <img src="/images/icon/facebook.png" alt="Facebook" className="newsletter-social-img" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.instagram.com/hazarhometr/"
                        className="box-icon square social-instagram social-line newsletter-social-icon"
                        aria-label="Instagram"
                      >
                        <img src="/images/icon/instagram.jpeg" alt="Instagram" className="newsletter-social-img" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.tiktok.com/@hazarhometr"
                        className="box-icon square social-tiktok social-line newsletter-social-icon"
                        aria-label="TikTok"
                      >
                        <img src="/images/icon/tiktok.png" alt="TikTok" className="newsletter-social-img" />
                      </a>
                    </li>
      {/* Responsive social icon styles */}
      <style jsx>{`
        .newsletter-social-icon {
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #eee;
          width: 56px;
          height: 56px;
          transition: box-shadow 0.2s;
        }
        .newsletter-social-icon:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .newsletter-social-img {
          width: 38px;
          height: 38px;
          object-fit: cover;
          border-radius: 8px;
        }
        @media (max-width: 600px) {
          .newsletter-social-icon {
            width: 40px;
            height: 40px;
          }
          .newsletter-social-img {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>
                  </ul>
                </div>
        
            <div className="text-center">
              <a
                href="#"
                data-bs-dismiss="modal"
                className="tf-btn btn-line fw-6 btn-hide-popup"
              >
                Daha Sonra
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
