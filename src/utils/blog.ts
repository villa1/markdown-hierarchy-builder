
import { useEffect, useState } from 'react';

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  image: string;
  featured: boolean;
  content?: string;
  slug?: string;
  // Hugo-like additional fields
  layout?: string;
  type?: string;
  section?: string;
  tags?: string[];
  weight?: number;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    // Moved blog files to public folder for easier access
    const blogFiles = [
      '/blog/python-programming.md',
      '/blog/understanding-cites.md',
      '/blog/global-bonsai-trends.md',
      // Add new blog files here
    ];
    
    const posts: BlogPost[] = [];
    
    // Process each markdown file (similar to Hugo's content files)
    for (const filePath of blogFiles) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          console.error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const text = await response.text();
        
        // Parse frontmatter (metadata) and content (similar to Hugo's front matter)
        const { frontmatter, content } = parseFrontmatter(text);
        
        // Create slug based on file name - Hugo convention
        const slug = filePath.split('/').pop()?.replace('.md', '') || '';
        
        // Determine section based on directory structure (Hugo-like)
        const pathParts = filePath.split('/');
        const section = pathParts[pathParts.length - 2] || 'blog';
        
        posts.push({
          id: posts.length + 1, // Ensure unique ID
          ...frontmatter as unknown as BlogPost,
          content,
          slug,
          section,
          // Default layout if not specified in frontmatter
          layout: frontmatter.layout || 'single',
          type: frontmatter.type || 'post',
          // Add default values for required fields if not present
          title: frontmatter.title || 'Untitled',
          excerpt: frontmatter.excerpt || '',
          category: frontmatter.category || 'General',
          author: frontmatter.author || 'Admin',
          authorRole: frontmatter.authorRole || '',
          date: frontmatter.date || new Date().toISOString().split('T')[0],
          readTime: frontmatter.readTime || '5 min read',
          image: frontmatter.image || '/placeholder.svg',
          featured: frontmatter.featured || false
        });
      } catch (error) {
        console.error(`Error loading content file ${filePath}:`, error);
      }
    }
    
    // For static pages, create placeholder content
    const staticPages = [
      { slug: 'about', title: 'About Us', section: 'about' },
      { slug: 'export-process', title: 'Export Process', section: 'export-process' },
      { slug: 'sustainability', title: 'Sustainability', section: 'sustainability' },
      { slug: 'faq', title: 'Frequently Asked Questions', section: 'faq' },
      { slug: 'testimonials', title: 'Testimonials', section: 'testimonials' },
      { slug: 'partners', title: 'Our Partners', section: 'partners' },
      { slug: 'press', title: 'Press Releases', section: 'press' },
      { slug: 'contact', title: 'Contact Us', section: 'contact' },
      { slug: 'privacy-policy', title: 'Privacy Policy', section: 'legal' },
      { slug: 'terms-of-service', title: 'Terms of Service', section: 'legal' },
      { slug: 'cookie-policy', title: 'Cookie Policy', section: 'legal' },
      { slug: 'accessibility', title: 'Accessibility', section: 'legal' },
      { slug: 'return-policy', title: 'Return Policy', section: 'legal' },
    ];
    
    // Add static pages to posts array
    staticPages.forEach((page, index) => {
      posts.push({
        id: 1000 + index, // Ensure unique ID different from blog posts
        title: page.title,
        slug: page.slug,
        section: page.section,
        excerpt: `This is the ${page.title} page`,
        category: 'Page',
        author: 'Admin',
        authorRole: '',
        date: new Date().toISOString().split('T')[0],
        readTime: '',
        image: '/placeholder.svg',
        featured: false,
        content: `# ${page.title}\n\nContent for the ${page.title} page will be displayed here.`,
        layout: 'single',
        type: 'page'
      });
    });
    
    // Sort by date (newest first) or by weight if available (Hugo convention)
    return posts.sort((a, b) => {
      // Use weight first if available (Hugo priority)
      if (a.weight !== undefined && b.weight !== undefined) {
        return a.weight - b.weight;
      }
      
      // Fall back to date sorting
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch (error) {
    console.error('Error loading content files:', error);
    return [];
  }
}

// Parse frontmatter from markdown (Hugo-compatible format)
function parseFrontmatter(markdown: string): { frontmatter: Record<string, any>; content: string } {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    return { 
      frontmatter: {}, 
      content: markdown 
    };
  }
  
  const frontmatterString = match[1];
  const content = markdown.replace(frontmatterRegex, '').trim();
  
  // Parse YAML-like frontmatter (similar to Hugo's front matter)
  const frontmatter: Record<string, any> = {};
  frontmatterString.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      // Store the raw string value
      const rawValue = valueParts.join(':').trim();
      
      // Set default value as the raw string
      let value: string | boolean | number | string[] = rawValue;
      
      // Convert boolean strings to actual booleans
      if (rawValue === 'true') value = true;
      if (rawValue === 'false') value = false;
      
      // Convert numeric strings to numbers
      // Only convert if the string contains only digits and doesn't have spaces
      if (!isNaN(Number(rawValue)) && rawValue !== '' && !rawValue.includes(' ')) {
        value = Number(rawValue);
      }
      
      // Handle arrays (Hugo supports arrays in front matter)
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        try {
          // Simple array parsing (comma-separated values)
          const arrayContent = rawValue.substring(1, rawValue.length - 1);
          value = arrayContent.split(',').map(item => item.trim());
        } catch (e) {
          // Fall back to original string if parsing fails
          console.error('Error parsing array:', e);
        }
      }
      
      frontmatter[key.trim()] = value;
    }
  });
  
  return { frontmatter, content };
}

// Custom hook for getting blog posts (acts like Hugo's list template context)
export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setLoading(true);
    fetchBlogPosts()
      .then(posts => {
        setPosts(posts);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching content files:', err);
        setError(err);
        setLoading(false);
      });
  }, []);
  
  return { posts, loading, error };
}

// Utility function to group posts by section (simulates Hugo's taxonomy functionality)
export function groupPostsBySection(posts: BlogPost[]): Record<string, BlogPost[]> {
  return posts.reduce((acc, post) => {
    const section = post.section || 'blog';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);
}

// Utility function for filtering posts by tags (simulates Hugo's taxonomy lists)
export function filterPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter(post => post.tags?.includes(tag));
}
