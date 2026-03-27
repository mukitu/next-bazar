-- =============================================
-- মুকিত: Site Pages Table (Policy & Info)
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS site_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  page_type text NOT NULL DEFAULT 'info',  -- 'info' or 'policy'
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Public can read active pages
CREATE POLICY "Anyone can read active pages"
  ON site_pages FOR SELECT
  USING (is_active = true);

-- Only admins can manage pages (use service key or check against profiles)
CREATE POLICY "Admins can manage pages"
  ON site_pages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default Info pages
INSERT INTO site_pages (slug, title, content, page_type, sort_order) VALUES
('about-us', 'আমাদের সম্পর্কে', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">মুকিত সম্পর্কে</h2>
<p>মুকিত বাংলাদেশের একটি বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। আমরা ২০২৪ সাল থেকে গ্রাহকদের সেরা মানের পণ্য সরবরাহ করে আসছি।</p>
<p style="margin-top: 12px;">আমাদের লক্ষ্য হলো প্রতিটি বাংলাদেশি পরিবারের কাছে সহজে, দ্রুত এবং সাশ্রয়ী মূল্যে মানসম্পন্ন পণ্য পৌঁছে দেওয়া।</p>
<h3 style="color: #15803d; margin-top: 24px; font-size: 18px;">আমাদের মিশন</h3>
<p>বাংলাদেশের প্রতিটি ঘরে বিশ্বমানের পণ্য সহজলভ্য করা।</p>
<h3 style="color: #15803d; margin-top: 24px; font-size: 18px;">যোগাযোগ করুন</h3>
<p>📞 01700-000000 | ✉️ support@mukit.com</p>
</div>', 'info', 1),

('contact', 'যোগাযোগ', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">আমাদের সাথে যোগাযোগ করুন</h2>
<div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
<p>📞 <strong>ফোন:</strong> 01700-000000</p>
<p style="margin-top: 8px;">✉️ <strong>ইমেইল:</strong> support@mukit.com</p>
<p style="margin-top: 8px;">📍 <strong>ঠিকানা:</strong> ঢাকা, বাংলাদেশ</p>
<p style="margin-top: 8px;">⏰ <strong>সময়:</strong> সকাল ৯টা - রাত ১০টা (সাত দিন)</p>
</div>
<p>যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন। আমাদের কাস্টমার সার্ভিস টিম সবসময় আপনার পাশে আছে।</p>
</div>', 'info', 2),

('terms', 'শর্তাবলী', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">শর্তাবলী ও নিয়মকানুন</h2>
<p>মুকিত ব্যবহার করার আগে অনুগ্রহ করে নিচের শর্তাবলী মনোযোগ দিয়ে পড়ুন।</p>
<h3 style="color: #15803d; margin-top: 20px;">১. অর্ডার</h3>
<p>অর্ডার দেওয়ার পর ২৪ ঘণ্টার মধ্যে বাতিল করা যাবে।</p>
<h3 style="color: #15803d; margin-top: 20px;">২. পেমেন্ট</h3>
<p>আমরা ক্যাশ অন ডেলিভারি (COD) এবং bKash/Nagad পেমেন্ট গ্রহণ করি।</p>
<h3 style="color: #15803d; margin-top: 20px;">৩. ডেলিভারি</h3>
<p>ঢাকার ভেতরে ১-২ দিন এবং ঢাকার বাইরে ৩-৫ দিনের মধ্যে ডেলিভারি দেওয়া হয়।</p>
</div>', 'info', 3),

('privacy', 'গোপনীয়তা নীতি', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">গোপনীয়তা নীতি</h2>
<p>আপনার ব্যক্তিগত তথ্য আমাদের কাছে সম্পূর্ণ নিরাপদ।</p>
<h3 style="color: #15803d; margin-top: 20px;">তথ্য সংগ্রহ</h3>
<p>আমরা শুধুমাত্র অর্ডার প্রক্রিয়াকরণের জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি।</p>
<h3 style="color: #15803d; margin-top: 20px;">তথ্য ব্যবহার</h3>
<p>আপনার তথ্য তৃতীয় পক্ষের সাথে কখনো শেয়ার করা হয় না।</p>
<h3 style="color: #15803d; margin-top: 20px;">নিরাপত্তা</h3>
<p>আমরা SSL এনক্রিপশন ব্যবহার করে আপনার তথ্য সুরক্ষিত রাখি।</p>
</div>', 'info', 4),

('career', 'ক্যারিয়ার', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">ক্যারিয়ার সুযোগ</h2>
<p>মুকিত এ যোগ দিন এবং বাংলাদেশের ই-কমার্স খাতকে এগিয়ে নিয়ে যান।</p>
<div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 16px;">
<p><strong>📧 CV পাঠান:</strong> career@mukit.com</p>
</div>
</div>', 'info', 5),

-- Policy pages
('return-policy', 'রিটার্ন পলিসি', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">রিটার্ন পলিসি</h2>
<p>পণ্য পাওয়ার <strong>৭ দিনের মধ্যে</strong> রিটার্ন করা যাবে, যদি পণ্যটি:</p>
<ul style="list-style: disc; padding-left: 24px; margin-top: 12px;">
  <li>ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত হয়</li>
  <li>ভুল পণ্য ডেলিভারি হয়</li>
  <li>ছবির সাথে সম্পূর্ণ আলাদা হয়</li>
</ul>
<h3 style="color: #15803d; margin-top: 24px;">রিটার্ন প্রক্রিয়া</h3>
<ol style="list-style: decimal; padding-left: 24px;">
  <li>আমাদের সাথে যোগাযোগ করুন</li>
  <li>পণ্যের ছবি পাঠান</li>
  <li>কুরিয়ারে পণ্য পাঠান</li>
  <li>যাচাই হলে রিফান্ড বা রিপ্লেসমেন্ট দেওয়া হবে</li>
</ol>
</div>', 'policy', 1),

('refund-policy', 'রিফান্ড পলিসি', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">রিফান্ড পলিসি</h2>
<p>রিটার্ন অনুমোদন হলে <strong>৩-৭ কার্যদিবসের মধ্যে</strong> রিফান্ড প্রক্রিয়া করা হবে।</p>
<h3 style="color: #15803d; margin-top: 20px;">রিফান্ড পদ্ধতি</h3>
<ul style="list-style: disc; padding-left: 24px;">
  <li>বিকাশ/নগদ - ৩ কার্যদিবস</li>
  <li>ব্যাংক ট্রান্সফার - ৫-৭ কার্যদিবস</li>
</ul>
<p style="margin-top: 16px; color: #dc2626;"><strong>⚠️ শিপিং চার্জ রিফান্ড করা হবে না।</strong></p>
</div>', 'policy', 2),

('exchange', 'এক্সচেঞ্জ', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">এক্সচেঞ্জ পলিসি</h2>
<p>সাইজ বা রঙের জন্য পণ্য পাওয়ার <strong>৩ দিনের মধ্যে</strong> এক্সচেঞ্জ করা যাবে।</p>
<h3 style="color: #15803d; margin-top: 20px;">এক্সচেঞ্জের শর্ত</h3>
<ul style="list-style: disc; padding-left: 24px;">
  <li>পণ্য অব্যবহৃত থাকতে হবে</li>
  <li>অরিজিনাল প্যাকেজিং থাকতে হবে</li>
  <li>ট্যাগ লাগানো থাকতে হবে</li>
</ul>
</div>', 'policy', 3),

('cancellation', 'বাতিল করুন', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">অর্ডার বাতিল করুন</h2>
<p>অর্ডার দেওয়ার <strong>২৪ ঘণ্টার মধ্যে</strong> বাতিল করা যাবে।</p>
<h3 style="color: #15803d; margin-top: 20px;">বাতিল করার উপায়</h3>
<ul style="list-style: disc; padding-left: 24px;">
  <li>"My Orders" থেকে অর্ডার বাতিল করুন</li>
  <li>আমাদের ফোনে কল করুন: 01700-000000</li>
</ul>
<p style="margin-top: 16px; color: #dc2626;"><strong>⚠️ শিপমেন্ট শুরু হলে বাতিল করা যাবে না।</strong></p>
</div>', 'policy', 4),

('extra-discount', 'এক্সট্রা ডিসকাউন্ট', '<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
<h2 style="color: #15803d; font-size: 24px; margin-bottom: 16px;">এক্সট্রা ডিসকাউন্ট</h2>
<p>বিশেষ ছাড় পেতে আমাদের নিয়মিত গ্রাহক হোন!</p>
<div style="background: #fef9c3; padding: 16px; border-radius: 12px; margin-top: 16px;">
  <p>🎯 <strong>৳৫০০০+ অর্ডারে ৫% অতিরিক্ত ছাড়</strong></p>
  <p style="margin-top: 8px;">🎯 <strong>রেফারেলে ৳১০০ বোনাস</strong></p>
  <p style="margin-top: 8px;">🎯 <strong>জন্মদিনে বিশেষ অফার</strong></p>
</div>
<p style="margin-top: 16px;">বিস্তারিত জানতে: 01700-000000</p>
</div>', 'policy', 5)
ON CONFLICT (slug) DO NOTHING;
