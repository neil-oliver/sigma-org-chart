import { UserData } from '../types';

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
];

const jobTitles = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'Senior Engineering Manager', 'Director of Engineering',
  'VP of Engineering', 'Product Manager', 'Senior Product Manager', 'Director of Product',
  'Designer', 'Senior Designer', 'Design Lead', 'Data Scientist', 'Senior Data Scientist',
  'DevOps Engineer', 'SRE', 'QA Engineer', 'Technical Writer', 'Analyst', 'HR Manager',
];

const orgUnits = [
  'Engineering', 'Product', 'Design', 'Data Science', 'DevOps', 'QA', 'HR', 'Finance',
];

const offices = ['San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Remote'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUniqueName(usedNames: Set<string>): string {
  let name: string;
  let attempts = 0;
  do {
    const first = randomChoice(firstNames);
    const last = randomChoice(lastNames);
    const suffix = attempts > 0 ? ` ${String.fromCharCode(65 + (attempts % 26))}` : '';
    name = `${first} ${last}${suffix}`;
    attempts++;
  } while (usedNames.has(name) && attempts < 1000);
  usedNames.add(name);
  return name;
}

/**
 * Generate a large mock org chart dataset
 * Creates a realistic hierarchy with configurable depth and width
 */
export function generateMockOrgData(options: {
  targetSize?: number;
  maxDirectReports?: number;
  maxDepth?: number;
} = {}): UserData[] {
  const {
    targetSize = 800,
    maxDirectReports = 12,
    maxDepth = 6,
  } = options;

  const users: UserData[] = [];
  const usedNames = new Set<string>();
  
  // Create CEO first
  const ceoName = generateUniqueName(usedNames);
  users.push({
    fullName: ceoName,
    email: `${ceoName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    slackUsername: `@${ceoName.toLowerCase().replace(/\s+/g, '_')}`,
    profileImage: `https://i.pravatar.cc/150?u=${encodeURIComponent(ceoName)}`,
    jobTitle: 'CEO',
    organizationUnit: 'Executive',
    manager: '',
    office: 'San Francisco',
    startDate: '2015-01-01',
  });

  // Build org tree level by level
  let currentLevel = [ceoName];
  let currentDepth = 0;

  while (users.length < targetSize && currentDepth < maxDepth) {
    const nextLevel: string[] = [];
    
    for (const managerName of currentLevel) {
      if (users.length >= targetSize) break;
      
      // Random number of direct reports (weighted toward lower numbers at deeper levels)
      const depthFactor = 1 - (currentDepth / maxDepth);
      const numReports = Math.floor(Math.random() * maxDirectReports * depthFactor) + 1;
      
      for (let i = 0; i < numReports && users.length < targetSize; i++) {
        const name = generateUniqueName(usedNames);
        const orgUnit = randomChoice(orgUnits);
        
        users.push({
          fullName: name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          slackUsername: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
          profileImage: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
          jobTitle: randomChoice(jobTitles),
          organizationUnit: orgUnit,
          manager: managerName,
          office: randomChoice(offices),
          startDate: `20${10 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        });
        
        nextLevel.push(name);
      }
    }
    
    currentLevel = nextLevel;
    currentDepth++;
  }

  return users;
}

