const { sequelize } = require('../models'); // Adjust path to your models

async function seedDatabase() {
  try {
    // Import your models
    const User = require('../models/user')(sequelize);
    const Course = require('../models/course')(sequelize);
    const Inscription = require('../models/inscription')(sequelize);

    // Create professors
    const professor1 = await User.create({
      name: 'Professor John Smith',
      email: 'john.smith@university.edu',
      role: 'professor',
      password: 'professor123'
    });

    const professor2 = await User.create({
      name: 'Professor Jane Doe',
      email: 'jane.doe@university.edu',
      role: 'professor',
      password: 'professor123'
    });

    // Create students
    const student1 = await User.create({
      name: 'Student Alice Johnson',
      email: 'alice.johnson@student.edu',
      role: 'student',
      password: 'student123'
    });

    const student2 = await User.create({
      name: 'Student Bob Wilson',
      email: 'bob.wilson@student.edu',
      role: 'student',
      password: 'student123'
    });

    // Create courses for professor 1
    const course1 = await Course.create({
      title: 'Mathematics 101',
      description: 'Introduction to basic mathematics concepts',
      professor_id: professor1.id,
      category: 'Mathematics',
      level: 'primero'
    });

    const course2 = await Course.create({
      title: 'Advanced Calculus',
      description: 'Deep dive into calculus and its applications',
      professor_id: professor1.id,
      category: 'Mathematics',
      level: 'tercero'
    });

    // Create courses for professor 2
    const course3 = await Course.create({
      title: 'Computer Science Fundamentals',
      description: 'Introduction to programming and algorithms',
      professor_id: professor2.id,
      category: 'Computer Science',
      level: 'primero'
    });

    const course4 = await Course.create({
      title: 'Data Structures',
      description: 'Study of fundamental data structures and their implementations',
      professor_id: professor2.id,
      category: 'Computer Science',
      level: 'segundo'
    });

    // Create inscriptions - both students enroll in professor1's first course
    await Inscription.create({
      enrollment_status: 'active',
      userId: student1.id,
      courseId: course1.id,
      paymentStatus: 'paid',
      paymentAmount: 50000
    });

    await Inscription.create({
      enrollment_status: 'active',
      userId: student2.id,
      courseId: course1.id,
      paymentStatus: 'paid',
      paymentAmount: 50000
    });

    console.log('Database seeded successfully!');
    console.log('Created:', {
      professors: [professor1.id, professor2.id],
      students: [student1.id, student2.id],
      courses: [course1.id, course2.id, course3.id, course4.id]
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;