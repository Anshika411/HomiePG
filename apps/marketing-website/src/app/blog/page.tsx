'use client';

import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';
import { motion } from 'framer-motion';
import { Clock, User, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  image: string;
};

export default function BlogPage() {
  const articles: Article[] = [
    {
      slug: 'how-to-choose-the-right-coliving-space',
      title: 'How to Choose the Right Co-Living Space for Your Needs',
      excerpt: 'Discover the essential factors to consider when comparing co-living PGs, including amenities, lease options, food policies, and commute distance.',
      date: 'June 28, 2026',
      readTime: '5 min read',
      author: 'Aarav Malhotra',
      category: 'Guides',
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
    },
    {
      slug: 'co-living-vs-traditional-apartments',
      title: 'Co-Living vs. Renting a Traditional Apartment: A Cost Comparison',
      excerpt: 'Renting a flat can have hidden expenses like deposits, security deposits, wifi, and maid costs. Let us do the financial comparison math.',
      date: 'June 24, 2026',
      readTime: '7 min read',
      author: 'Neha Sen',
      category: 'Finances',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
    },
    {
      slug: 'essential-security-checklist-for-tenants',
      title: 'The Essential Tenant Safety & Security Checklist for PGs',
      excerpt: 'Your safety is our top priority. Learn how to audit emergency protocols, security cameras, gate registers, and visitor passes.',
      date: 'June 18, 2026',
      readTime: '4 min read',
      author: 'Amit Kumar',
      category: 'Safety',
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=500&q=80',
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <Container>
        <FadeUp className="text-center mb-12">
          <SectionHeading
            eyebrow="Knowledge Base"
            title="Latest Articles &"
            titleHighlight="Co-Living Guides"
            subtitle="Expert tips on choosing PGs, managing budgets, and staying safe during your city move."
          />
        </FadeUp>

        <StaggerChildren className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {articles.map((article, i) => (
            <motion.div key={i} variants={fadeUpVariants}>
              <HoverLift>
                <Card padding="none" className="h-full flex flex-col overflow-hidden border border-border/60">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                    <span className="absolute top-3 left-3 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[0.7rem] text-text-muted mb-2.5 font-semibold">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-text-light" />
                          {article.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-text-light" />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-text-dark text-[0.95rem] leading-snug hover:text-brand-blue transition-colors mb-2">
                        <Link href={`/blog/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-text-muted font-medium leading-relaxed line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>

                    <Link
                      href={`/blog/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue mt-5 group"
                    >
                      Read Article
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </Card>
              </HoverLift>
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </div>
  );
}
