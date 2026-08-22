allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Some plugins (e.g. tflite_flutter) don't pin their own Android module's
// Java/Kotlin targets, so they fall back to whatever the local JDK defaults
// to - which can disagree with the Kotlin compiler's target and fail the
// build ("Inconsistent JVM Target Compatibility"). Force every module to the
// same 17 this app's own build.gradle.kts already uses. Hooked via
// plugins.withId (not afterEvaluate) since ":app" is evaluated eagerly above
// (evaluationDependsOn) and calling afterEvaluate on it after that point
// throws "project is already evaluated".
subprojects {
    // ":app" already pins its own targets in app/build.gradle.kts and gets
    // evaluated eagerly above (evaluationDependsOn) - calling afterEvaluate
    // on it again here hits "project is already evaluated", so only plugin
    // library modules need this. Those modules (e.g. tflite_flutter) set
    // their OWN compileOptions inside their `android {}` block, which runs
    // as part of the same script evaluation - afterEvaluate is what lets us
    // override that after the fact, once the whole module script has run.
    if (project.name == "app") return@subprojects

    afterEvaluate {
        extensions.findByType<com.android.build.gradle.BaseExtension>()?.apply {
            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
        tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
            compilerOptions {
                jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
